import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ProfileRepository } from "@/repositories/ProfileRepository";

interface ConsumerAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const ConsumerAuthContext = createContext<ConsumerAuthContextType | undefined>(undefined);

export function ConsumerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (initialSession?.user) {
          await ProfileRepository.ensureCurrentUserProfile(initialSession.user);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setProfileError(null);
        }
      } catch (err: any) {
        console.error("Failed to initialize auth or ensure profile:", err);
        if (mounted) {
          setProfileError(err.message || "Erro ao carregar ou criar seu perfil.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      try {
        if (mounted) setIsLoading(true);
        if (currentSession?.user) {
          await ProfileRepository.ensureCurrentUserProfile(currentSession.user);
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setProfileError(null);
        }
      } catch(err: any) {
        console.error("Failed to ensure profile on state change:", err);
        if (mounted) {
          setProfileError(err.message || "Erro ao configurar seu perfil.");
        }
      } finally {
        if (mounted) {
           setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">Erro de Sessão</h2>
        <p className="text-gray-700">{profileError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <ConsumerAuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </ConsumerAuthContext.Provider>
  );
}

export const useConsumerAuth = () => {
  const context = useContext(ConsumerAuthContext);
  if (context === undefined) {
    throw new Error("useConsumerAuth must be used within a ConsumerAuthProvider");
  }
  return context;
};
