import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface User {
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  supabaseId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginAttempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CORRECT_USERNAME = 'admin@acaihouse.com';
const CORRECT_PASSWORD = 'admin@house';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUser({
          username: session.user.email || CORRECT_USERNAME,
          role: 'admin',
          supabaseId: session.user.id
        });
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for session timeout
  useEffect(() => {
    const checkSession = () => {
      if (isAuthenticated && Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkSession, 1000);
    const updateActivity = () => setLastActivity(Date.now());

    if (isAuthenticated) {
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [isAuthenticated, lastActivity]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Check if account is locked
    if (lockoutEndTime && Date.now() < lockoutEndTime) {
      return false;
    }

    // Convert username to email format if needed
    const email = username.includes('@') ? username : CORRECT_USERNAME;

    // Validate credentials locally first
    if ((username === CORRECT_USERNAME || username === 'acaihouse.admin') && password === CORRECT_PASSWORD) {
      try {
        // Authenticate with Supabase
        const { data: supabaseAuthData, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          console.error('Supabase authentication failed:', error);
          // Handle failed login attempt
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            setLockoutEndTime(Date.now() + LOCKOUT_DURATION);
            setLoginAttempts(0);
          }
          return false;
        }

        if (supabaseAuthData.user) {
          setIsAuthenticated(true);
          setUser({
            username: CORRECT_USERNAME,
            role: 'admin',
            supabaseId: supabaseAuthData.user.id
          });
          setLoginAttempts(0);
          setLockoutEndTime(null);
          navigate('/admin/dashboard');
          return true;
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Handle failed login attempt
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          setLockoutEndTime(Date.now() + LOCKOUT_DURATION);
          setLoginAttempts(0);
        }
        return false;
      }
    }

    // Handle failed login attempt
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      setLockoutEndTime(Date.now() + LOCKOUT_DURATION);
      setLoginAttempts(0);
    }

    return false;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
    
    setIsAuthenticated(false);
    setUser(null);
    navigate('/admin/login');
  };

  const isLocked = lockoutEndTime ? Date.now() < lockoutEndTime : false;

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      loginAttempts,
      isLocked,
      lockoutEndTime
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}