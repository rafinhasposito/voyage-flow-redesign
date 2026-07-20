import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

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
