"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  AuthSession,
  AuthUser,
  LoginInput,
  RegisterInput,
  logout,
  refreshSession as requestRefreshSession,
  login,
  register
} from "@/lib/auth";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: null;
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCurrentSession: () => Promise<AuthSession | null>;
};

const LEGACY_ACCESS_TOKEN_KEY = "multivendor.accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "multivendor.refreshToken";
const USER_KEY = "multivendor.user";

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((session: AuthSession) => {
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshCurrentSession = useCallback(async () => {
    const session = await requestRefreshSession();
    persistSession(session);

    return session;
  }, [persistSession]);

  useEffect(() => {
    const restoreSession = async () => {
      localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
      localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);

      try {
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch {
        localStorage.removeItem(USER_KEY);
      }

      try {
        await refreshCurrentSession();
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [clearSession, refreshCurrentSession]);

  const signIn = useCallback(
    async (input: LoginInput) => {
      persistSession(await login(input));
    },
    [persistSession]
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      persistSession(await register(input));
    },
    [persistSession]
  );

  const signOut = useCallback(async () => {
    clearSession();
    await logout().catch(() => undefined);
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken: null,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshCurrentSession
    }),
    [
      accessToken,
      isLoading,
      refreshCurrentSession,
      signIn,
      signOut,
      signUp,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
