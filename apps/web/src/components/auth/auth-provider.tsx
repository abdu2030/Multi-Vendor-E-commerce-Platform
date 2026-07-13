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
  getMe,
  login,
  logout,
  refreshSession as requestRefreshSession,
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

const ACCESS_TOKEN_KEY = "multivendor.accessToken";
const REFRESH_TOKEN_KEY = "multivendor.refreshToken";
const USER_KEY = "multivendor.user";

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((session: AuthSession) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser) as AuthUser);
      }

      try {
        if (storedAccessToken) {
          const currentUser = await getMe(storedAccessToken);
          setUser(currentUser);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        } else {
          await refreshCurrentSession();
        }
      } catch {
        try {
          await refreshCurrentSession();
        } catch {
          clearSession();
        }
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