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
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp, appSignIn } = useAuth();

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
        <Text style={styles.title}>Create Account</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholderTextColor="#999"
        />
        <Button title="Sign Up" onPress={handleSignUp} />
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={{ width: "100%", height: 50, marginVertical: 8 }}
          onPress={async () => {appSignIn()}}
        />
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
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
  link: {
    color: "#1877FF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 24,
  },
});
