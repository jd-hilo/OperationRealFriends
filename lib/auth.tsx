import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import { User } from "../types";
import * as AppleAuthentication from "expo-apple-authentication";
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  appSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
          email: email,
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
          session.user.email || ""
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
      // Sign in via Supabase Auth.
      if (credential.identityToken) {
        const {
          error,
          data: { user },
        } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (!error) {
          if (user) {
            const profile = await ensureUserProfile(user.id, user?.email);
            setUser(profile);
          }
        }
      } else {
        throw new Error("No identityToken.");
      }
    } catch (e) {
      console.log("error :", e);
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
      value={{ user, session, loading, signIn, signUp, signOut, appSignIn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
