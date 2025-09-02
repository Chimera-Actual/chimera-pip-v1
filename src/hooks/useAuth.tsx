import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  showingBootSequence: boolean;
  completeBootSequence: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showingBootSequence, setShowingBootSequence] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Show boot sequence only for actual sign-in events (not session restoration)
        if (event === 'SIGNED_IN' && session?.user) {
          const hasShownBootSequence = sessionStorage.getItem('boot_sequence_shown');
          if (!hasShownBootSequence) {
            setShowingBootSequence(true);
            sessionStorage.setItem('boot_sequence_shown', 'true');
          }
        }
        
        // Clear boot sequence flag on sign out
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem('boot_sequence_shown');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const completeBootSequence = useCallback(() => {
    setShowingBootSequence(false);
  }, []);

  const signOut = async () => {
    try {
      // Clean up auth state
      setSession(null);
      setUser(null);
      setShowingBootSequence(false);
      
      // Clear boot sequence flag
      sessionStorage.removeItem('boot_sequence_shown');
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    showingBootSequence,
    completeBootSequence,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}