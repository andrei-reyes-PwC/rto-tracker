"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  logout as logoutRequest,
  type AuthenticatedUser,
} from "@/api/auth";

type AuthContextValue = {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  refreshUser: () => Promise<AuthenticatedUser | null>;
  logout: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const succeeded = await logoutRequest();
      if (succeeded) {
        setUser(null);
      }
      return succeeded;
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isLoading, isLoggingOut, refreshUser, logout }),
    [user, isLoading, isLoggingOut, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
