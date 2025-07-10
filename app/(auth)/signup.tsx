import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import Button from "../../components/Button";
import * as AppleAuthentication from "expo-apple-authentication";
import EmailVerificationModal from "components/emailVerificationModal";
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOTP] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    signUp,
    appSignIn,
    otpTimer,
    loading,
    handleVerifyOTP,
    signInOTP,
    showOTP,
  } = useAuth();
  const PASSWORD_EMAILS = ["apple@test.com", "jd@sull.com", "jd@sull1.com"];
  const checkOTPorPassword = () => {
    if (PASSWORD_EMAILS.includes(email.toLowerCase())) {
      setShowPassword(true);
      return;
    }
    signInOTP(email);
  };
  const handleSignUp = async () => {
    try {
      setError("");
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      await signUp(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.bg}>
      {/* <Image source={require('../../assets/logo.png')} style={styles.logo} /> */}
      <View style={styles.card}>
        <Text style={styles.title}>Enter email</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholderTextColor="#999"
        />
        {/* <View style={{}}>
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
        </View> */}

        {showPassword && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholderTextColor="#999"
          />
        )}
        {!showPassword && (
          <Button title="Continue" onPress={checkOTPorPassword} />
        )}
        {showPassword && <Button title="Sign Up" onPress={handleSignUp} />}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={24}
          style={styles.appleButton}
          onPress={async () => {appSignIn()}}
        />
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
      <EmailVerificationModal
        visible={showOTP}
        email={email}
        otp={otp}
        setOTP={setOTP}
        otpTimer={otpTimer}
        handleVerifyOTP={handleVerifyOTP}
        loading={loading}
        onClose={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#F7F9FE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  otpContainer: {
    width: "100%",
    alignItems: "center",
  },
  resendText: {
    marginTop: 16,
    color: "#8A8E8F",
    fontSize: 14,
    fontFamily: "Nunito",
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 32,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: "#333A3C",
    marginBottom: 8,
    textAlign: "center",
    textTransform: "lowercase",
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: "Nunito",
    color: "#8A8E8F",
    textAlign: "center",
    marginBottom: 32,
    textTransform: "lowercase",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    fontSize: 16,
    color: "#222",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    fontWeight: "500",
    fontFamily: "Nunito",
    textTransform: "lowercase",
  },
  collegeScrollView: {
    width: "100%",
    maxHeight: 400,
  },
  collegeScrollContent: {
    paddingBottom: 16,
  },
  collegeContainer: {
    width: "100%",
  },
  collegeOption: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedCollege: {
    backgroundColor: "#FFEFB4",
  },
  collegeText: {
    fontSize: 16,
    fontFamily: "Nunito",
    color: "#333A3C",
  },
  selectedCollegeText: {
    fontWeight: "600",
  },
  reviewContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 24,
    width: "100%",
  },
  resendLink: {
    marginTop: 16,
    color: "#333A3C",
    fontSize: 14,
    fontFamily: "Nunito",
    textDecorationLine: "underline",
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: "Nunito",
    color: "#333A3C",
    marginBottom: 4,
    textTransform: "lowercase",
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: "Nunito",
    color: "#333A3C",
  },
  error: {
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  button: {
    width: 56,
    height: 56,
    backgroundColor: "#FFEFB4",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    backgroundColor: "#F8F8F8",
  },
  buttonWithMargin: {
    marginLeft: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Nunito",
    color: "#333A3C",
    textTransform: "lowercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Nunito",
    color: "#8A8E8F",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Nunito",
    color: "#333A3C",
  },
  inputContainer: {
    width: "100%",
    position: "relative",
  },
  inputAvailable: {
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    resizeMode: "contain",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FAFAFA",
    borderRadius: 32,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1,
  },
  link: {
    color: "#1877FF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 24,
  },
  appleButton: {
    width: "100%",
    height: 56,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});
