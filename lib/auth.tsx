import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import { User } from "../types";
import * as AppleAuthentication from "expo-apple-authentication";
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  showPassword: boolean;
  otpTimer: number;
  otp: number;
  showOTP: boolean;
  setShowOTP: (show: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  appSignIn: () => Promise<void>;
  handleVerifyOTP: (email: string, otp: string) => Promise<void>;
  signInOTP: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [showOTP, setShowOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otp, setOTP] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);
  const ensureUserProfile = async (userId: string, email: string) => {
    try {
      // First try to fetch the profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      // If profile exists, return it
      if (existingProfile) {
        return existingProfile;
      }

      // If no profile exists, create one
      const { error: insertError } = await supabase.from("users").upsert([
        {
          id: userId,
          email: email || '', // Provide default empty string if email is undefined
          created_at: new Date().toISOString(),
          has_completed_quiz: false,
          submitted: false,
          last_submission_date: null,
          current_group_id: null,
        },
      ]);

      if (insertError) {
        console.error("Error creating user record:", insertError);
        throw insertError;
      }

      // Fetch the newly created profile
      const { data: newProfile, error: newFetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (newFetchError) {
        console.error("Error fetching new user profile:", newFetchError);
        throw newFetchError;
      }

      return newProfile;
    } catch (error) {
      console.error("Error in ensureUserProfile:", error);
      throw error;
    }
  };

  const handleAuthStateChange = async (session: Session | null) => {
    try {
      setSession(session);
      if (session?.user) {
        const profile = await ensureUserProfile(
          session.user.id,
          session.user.email ?? '' // Use nullish coalescing to provide default empty string
        );
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error handling auth state change:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error in signIn:", error);
      throw error;
    }
  };
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const checkExistingUser = async (email: string) => {
    try {
      console.log("=== checkExistingUser START ===");
      console.log("Checking email:", email);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/check-existing-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        console.error("Edge function response not ok:", response.status);
        throw new Error("Failed to check existing user");
      }

      const result = await response.json();
      console.log("Edge function result:", result);

      return result;
    } catch (error) {
      console.error("Error checking existing user:", error);
      throw error;
    }
  };
  const signInOTP = async (email: string) => {
    try {
      console.log("=== handleSendOTP START ===");
      console.log("Loading state:", loading);
      if (!email || !validateEmail(email)) {
        console.log("Email validation failed");
        return;
      }
      
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email,
      });
      
      console.log("otp sent");
      if (signInError) {
        console.error("OTP send error:", signInError);
        throw signInError;
      }
      
      setShowOTP(true);
      setOtpTimer(30);
    } catch (error) {
      console.error("Error in signInOTP:", error);
      throw error;
    }
  };

  const handleVerifyOTP = async (email: string, otp: string) => {
    try {
      setLoading(true);

      if (!otp) {
        console.log("OTP validation failed - no OTP provided");
        alert("Please enter the verification code");
        return;
      }

      console.log("OTP validation passed, verifying OTP...");
      // First verify the OTP
      const {
        data: { user },
        error: verifyError,
      } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: "email",
      });

      if (verifyError) {
        console.error("OTP verification error:", verifyError);
        throw verifyError;
      }

      console.log("OTP verified successfully");
      console.log("User from OTP verification:", user);

      // Check if user has a profile
      if (user) {
        console.log("User exists, checking for profile...");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.log("Profile query error:", profileError);
        }

        console.log("Profile data:", profile);

        if (profile && profile.username && profile.college) {
          console.log("Profile exists and is complete, signing user in...");
          // User exists and has a complete profile, sign them in
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) {
            console.error("Session error:", sessionError);
            throw sessionError;
          }

          console.log("Session data:", session);

          if (session) {
            console.log("Session exists, navigating to tabs...");
            // Wait a brief moment to ensure session state is updated
            await new Promise((resolve) => setTimeout(resolve, 100));
            return;
          }
        } else {
          console.log(
            "No profile exists or profile is incomplete, continuing with sign up..."
          );
        }
      } else {
        console.log("No user returned from OTP verification");
      }

      // If no profile exists or profile is incomplete, continue with sign up
      console.log("Moving to username step...");
      setOtpTimer(0); // Reset timer
      setShowOTP(false)
      console.log("=== handleVerifyOTP END ===");
    } catch (err) {
      console.error("handleVerifyOTP catch error:", err);
    } finally {
      setLoading(false);
      console.log("handleVerifyOTP loading set to false");
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting sign up with:", {
        email,
        passwordLength: password.length,
      });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            "https://pgnzcvlvyomsfvpiukqj.supabase.co/auth/v1/verify",
        },
      });
      console.log("Sign up response:", { data, error });
      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }

      // Create and fetch user profile after successful signup
      if (data.user) {
        const profile = await ensureUserProfile(data.user.id, email);
        setUser(profile);
      }
    } catch (error) {
      console.error("Error in signUp:", error);
      throw error;
    }
  };
  const appSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error("No identity token");
      if (!credential.email) throw new Error("No email provided");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user data");

      await ensureUserProfile(
        data.user.id,
        credential.email
      );
    } catch (error: any) { // Type the error as any since we know it's from Apple Authentication
      if (error.code === "ERR_REQUEST_CANCELED") {
        // Handle user canceling the sign-in flow
        console.log("Sign in canceled");
      } else {
        console.error("Error in appSignIn:", error);
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        showPassword: false,
        otpTimer,
        otp,
        showOTP,
        setShowOTP,
        signIn,
        signUp,
        signOut,
        appSignIn,
        handleVerifyOTP,
        signInOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
