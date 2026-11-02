import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { generateReferralCode } from '@/lib/utils';
import { watchTable } from '@/lib/realtime';

export interface ProfileData {
  id: string;
  user_id: string;
  nickname: string;
  phone: string;
  avatar_url: string;
  wallet_balance: number;
  carbon_points: number;
  vip_level: number;
  withdrawal_password: string;
  referral_code: string;
  referrer_code: string;
  total_earnings: number;
  free_vehicle_used: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, phone: string, referralCode?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await loadProfile(session.user.id);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    return watchTable('profile', { table: 'profiles', filter: `user_id=eq.${userId}` }, () => {
      loadProfile(userId);
    });
  }, [userId]);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as ProfileData);
    }
    setLoading(false);
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, phone: string, referralCode?: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const code = generateReferralCode();
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        phone,
        referral_code: code,
        referrer_code: referralCode || '',
        nickname: 'Member' + Math.floor(Math.random() * 10000),
        wallet_balance: 0,
        carbon_points: 0,
        vip_level: 0,
        total_earnings: 0,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      if (referralCode && referralCode.trim()) {
        const { error: referralError } = await supabase.rpc('process_referral_signup', {
          p_new_user_id: data.user.id,
          p_referrer_code: referralCode.trim(),
        });
        if (referralError) {
          console.error('Referral processing error:', referralError);
        }
      }
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
