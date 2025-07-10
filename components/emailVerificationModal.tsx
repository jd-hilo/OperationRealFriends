import React from 'react';
import { Modal, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography } from './typography';

interface EmailVerificationModalProps {
  visible: boolean;
  email: string;
  otp: string;
  setOTP: (otp: string) => void;
  otpTimer: number;
  handleVerifyOTP: (email: string, otp: string) => void;
  loading: boolean;
  onClose: () => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  email,
  otp,
  setOTP,
  otpTimer,
  handleVerifyOTP,
  loading,
  onClose
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.blurContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Typography variant="body" style={styles.closeButtonText}>✕</Typography>
          </TouchableOpacity>
          
          <Typography variant="h1" style={styles.stepTitle}>
            verify your email
          </Typography>
          <Typography variant="body" style={styles.stepSubtitle}>
            enter the 6-digit code we sent to {email}
          </Typography>

          <View style={styles.otpContainer}>
            <TextInput
              value={otp}
              onChangeText={setOTP}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              placeholderTextColor="#8A8E8F"
            />

            {otpTimer > 0 ? (
              <Typography variant="body" style={styles.resendText}>
                resend code in {otpTimer}s
              </Typography>
            ) : (
              <TouchableOpacity
                onPress={() => handleVerifyOTP(email, otp)}
                disabled={loading}
              >
                <Typography variant="body" style={styles.resendLink}>
                  resend code
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleVerifyOTP(email, otp)}
            disabled={loading}
          >
            <Typography variant="body" style={styles.resendLink}>
              Verify
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent dark background
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  stepTitle: {
    marginBottom: 10,
    marginTop: 20,
  },
  stepSubtitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    fontSize: 24,
    textAlign: 'center',
    padding: 10,
    marginBottom: 10,
  },
  resendText: {
    textAlign: 'center',
    color: '#888',
  },
  resendLink: {
    color: '#007BFF',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default EmailVerificationModal;
