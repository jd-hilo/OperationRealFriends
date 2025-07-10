import React from 'react';
import { Modal, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur'; 
import { Typography } from './typography';

const EmailVerificationModal = ({
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
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.modalContent}>
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
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  stepTitle: {
    marginBottom: 10,
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
