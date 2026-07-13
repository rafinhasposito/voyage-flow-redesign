import React, { useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AdminAuthContext } from './AdminAuthContext';
import { mapAdminAuthError } from '@/lib/adminAuthUtils';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const initialized = useRef(false);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (initialized.current) {
            setIsLoading(false);
          }
        }
      }
    );

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (mounted) setAuthError(mapAdminAuthError(error));
        } else if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        if (mounted) setAuthError(mapAdminAuthError(err));
      } finally {
        if (mounted) {
          initialized.current = true;
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setAuthError(null);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    clearError();
    const cleanEmail = email.trim();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        setAuthError(mapAdminAuthError(error));
        return false;
      }
      return true;
    } catch (err) {
      setAuthError(mapAdminAuthError(err));
      return false;
    }
  };

  const signOut = async (): Promise<boolean> => {
    clearError();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError('Não foi possível sair. Tente novamente.');
        return false;
      }
      return true;
    } catch (err) {
      setAuthError('Não foi possível sair. Tente novamente.');
      return false;
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        authError,
        signIn,
        signOut,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
