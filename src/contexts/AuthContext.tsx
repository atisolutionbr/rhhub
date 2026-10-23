import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { UserProfile, UserType } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    userType: UserType,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.error("Error loading profile:", error);
      return;
    }
    setProfile(data as UserProfile);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadProfile(sess.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const translateError = (message: string): string => {
    const map: Record<string, string> = {
      "Invalid login credentials": "Email ou senha incorretos",
      "Email not confirmed": "Email não confirmado",
      "User already registered": "Este email já está cadastrado",
      "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres",
      "Unable to send email": "Não foi possível enviar o email de confirmação",
      "Password is known to be weak and easy to guess, please choose a different one": "Esta senha foi detectada em vazamentos. Recomendamos trocar, mas você pode continuar.",
    };
    return map[message] || message;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateError(error.message) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    userType: UserType,
    fullName: string
  ) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password, user_type: userType, full_name: fullName }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "Erro ao criar conta" };

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError && !signInError.message.includes("already")) {
      return { error: null };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
