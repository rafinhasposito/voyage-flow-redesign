import { createContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export interface AdminAuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  clearError: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
