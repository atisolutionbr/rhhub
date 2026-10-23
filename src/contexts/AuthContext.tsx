import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { UserProfile, UserType } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, userType: UserType, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const connectionError = "Não foi possível conectar. Verifique sua conexão e tente novamente.";
function translateError(message: string): string {
  const messages: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos",
    "Email not confirmed": "Email não confirmado",
    "User already registered": "Este email já está cadastrado",
    "Password should be at least 6 characters": "A senha deve ter no mínimo 8 caracteres",
    "Unable to send email": "Não foi possível enviar o email de confirmação",
    "Password is known to be weak and easy to guess, please choose a different one": "Escolha outra senha: esta foi encontrada em vazamentos.",
  };
  return messages[message] || message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileOwner, setProfileOwner] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRequest = useRef(0);

  const loadProfile = useCallback(async (uid: string) => {
    const request = ++profileRequest.current;
    setProfileOwner(null); setProfile(null); setProfileError(null);
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", uid).maybeSingle();
      if (request !== profileRequest.current) return;
      if (error || !data) setProfileError("Não foi possível carregar seu perfil.");
      else setProfile(data as UserProfile);
    } catch {
      if (request === profileRequest.current) setProfileError(connectionError);
    } finally {
      if (request === profileRequest.current) setProfileOwner(uid);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const applySession = (next: Session | null) => {
      if (!active) return;
      setSession(next); setUser(next?.user ?? null); setSessionReady(true);
    };
    // Start profile requests in a separate effect, outside Supabase's auth lock.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      applySession(next);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!authEventReceived) applySession(data.session);
    }).catch(() => {
      if (!authEventReceived) applySession(null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (userId) void loadProfile(userId);
    else { setProfile(null); setProfileOwner(null); setProfileError(null); }
    return () => { profileRequest.current++; };
  }, [userId, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? translateError(error.message) : null };
    } catch { return { error: connectionError }; }
  };

  const signUp = async (email: string, password: string, userType: UserType, fullName: string) => {
    if (!["candidate", "company"].includes(userType)) return { error: "Tipo de conta inválido." };
    if (password.length < 8) return { error: "A senha deve ter no mínimo 8 caracteres." };
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}`, apikey: anonKey },
        body: JSON.stringify({ email: email.trim(), password, user_type: userType, full_name: fullName.trim() }),
        signal: AbortSignal.timeout(30000),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { error: json.error || "Não foi possível criar a conta. Tente novamente." };
      const result = await signIn(email, password);
      return result.error ? { error: "Sua conta foi criada, mas não foi possível entrar. Acesse Entrar para tentar novamente." } : result;
    } catch { return { error: connectionError }; }
  };

  const signOut = async () => {
    try { await supabase.auth.signOut({ scope: "local" }); }
    finally {
      profileRequest.current++;
      setUser(null); setSession(null); setProfile(null); setProfileOwner(null); setProfileError(null);
    }
  };
  const loading = !sessionReady || Boolean(userId && profileOwner !== userId);
  const currentProfile = profile?.id === userId ? profile : null;
  return <AuthContext.Provider value={{ user, session, profile: currentProfile, loading, profileError, signIn, signUp, signOut, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
