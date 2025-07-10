import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
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
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        
        <View style={styles.card}>
          <Text style={styles.title}>Enter your email</Text>
          <Text style={styles.subtitle}>We'll send you a verification code</Text>
          
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
            <TouchableOpacity
              style={styles.continueButton}
              onPress={checkOTPorPassword}
              disabled={loading}
            >
              <LinearGradient
                colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {showPassword && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={24}
            style={styles.appleButton}
            onPress={async () => {appSignIn()}}
          />

          <TouchableOpacity 
            onPress={() => router.push("/(auth)/login")}
            style={styles.linkButton}
          >
            <Text style={styles.link}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <EmailVerificationModal
        visible={showOTP}
        email={email}
        otp={otp}
        setOTP={setOTP}
        otpTimer={otpTimer}
        handleVerifyOTP={handleVerifyOTP}
        loading={loading}
        onClose={() => setShowOTP(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
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
    fontFamily: "PlanetComic",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: "#222",
    marginBottom: 16,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  error: {
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: "700",
  },
  appleButton: {
    width: "100%",
    height: 56,
    marginTop: 8,
    marginBottom: 24,
  },
  linkButton: {
    padding: 8,
  },
  link: {
    color: "#4B1AFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
