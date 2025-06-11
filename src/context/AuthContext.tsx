import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  role: 'admin' | 'editor' | 'viewer';
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

const CORRECT_USERNAME = 'acaihouse.admin';
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

    // Validate credentials
    if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setUser({
        username: CORRECT_USERNAME,
        role: 'admin'
      });
      setLoginAttempts(0);
      setLockoutEndTime(null);
      navigate('/admin/dashboard');
      return true;
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

  const logout = () => {
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