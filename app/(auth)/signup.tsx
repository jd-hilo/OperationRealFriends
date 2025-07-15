import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  KeyboardAvoidingViewProps,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import Button from "../../components/Button";
import * as AppleAuthentication from "expo-apple-authentication";
import EmailVerificationModal from "components/emailVerificationModal";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  
  const {
    signUp,
    appSignIn,
    otpTimer,
    loading,
    handleVerifyOTP,
    signInOTP,
    showOTP,
    signIn,
    setShowOTP,
  } = useAuth();
  
  const PASSWORD_EMAILS = ["apple@test.com", "jd@sull.com", "jd@sull1.com"];
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkOTPorPassword = () => {
    if (PASSWORD_EMAILS.includes(email.toLowerCase())) {
      setShowPassword(true);
      return;
    }
    signInOTP(email);
  };

  const handleSignIn = async () => {
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
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Determine the behavior based on platform
  const keyboardBehavior: KeyboardAvoidingViewProps["behavior"] = Platform.OS === "ios" ? "padding" : "height";

  return (
    <KeyboardAvoidingView 
      behavior={keyboardBehavior}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <LinearGradient
        colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
        locations={[0, 0.4808, 0.9904]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <View style={styles.card}>
              <Text style={styles.title}>Enter your email</Text>
              <Text style={styles.subtitle}>We will send a code to verify</Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
                    placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
                    placeholderTextColor="#999"
                  />
                </View>

                {showOTP && (
                  <View style={styles.otpContainer}>
                    <Text style={styles.inputLabel}>Verification Code</Text>
                    <Text style={styles.otpSubtitle}>Enter the 6-digit code we sent to {email}</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      value={otp}
                      onChangeText={setOTP}
                      placeholder="000000"
                      keyboardType="number-pad"
                      maxLength={6}
          placeholderTextColor="#999"
        />
                    
                    <View style={styles.otpActions}>
                      {otpTimer > 0 ? (
                        <Text style={styles.resendText}>
                          Resend code in {otpTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => signInOTP(email)}
                          disabled={loading}
                        >
                          <Text style={styles.resendLink}>
                            Resend code
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => handleVerifyOTP(email, otp)}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={["#3AB9F9", "#4B1AFF"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.buttonText}>Verify Code</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

        {showPassword && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
                      placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholderTextColor="#999"
          />
                  </View>
        )}

                {!showPassword && !showOTP && (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={checkOTPorPassword}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={["#3AB9F9", "#4B1AFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>Continue with Email</Text>
                    </LinearGradient>
                  </TouchableOpacity>
        )}

                {showPassword && (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleSignIn}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={["#3AB9F9", "#4B1AFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

        <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={28}
          style={styles.appleButton}
          onPress={async () => {appSignIn()}}
        />
      </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
    flex: 1,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "PlanetComic",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
    lineHeight: 22,
  },
  formContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  errorContainer: {
    width: "100%",
    marginBottom: 20,
  },
  error: {
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    width: "100%",
  },
  continueButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  dividerText: {
    color: "#666",
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  appleButton: {
    height: 56,
    width: "100%",
    marginBottom: 16,
  },
  otpContainer: {
    width: "100%",
    marginTop: 16,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    marginLeft: 4,
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: "600",
  },
  otpActions: {
    marginTop: 16,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  resendLink: {
    fontSize: 14,
    color: "#4B1AFF",
    fontWeight: "600",
    marginBottom: 16,
  },
});
