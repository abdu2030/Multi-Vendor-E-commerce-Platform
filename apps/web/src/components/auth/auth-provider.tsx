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
  refreshSession,
  register
} from "@/lib/auth";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = "multivendor.accessToken";
const REFRESH_TOKEN_KEY = "multivendor.refreshToken";
const USER_KEY = "multivendor.user";

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((session: AuthSession) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!storedAccessToken || !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);

      if (storedUser) {
        setUser(JSON.parse(storedUser) as AuthUser);
      }

      try {
        const currentUser = await getMe(storedAccessToken);
        setUser(currentUser);
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } catch {
        try {
          persistSession(await refreshSession(storedRefreshToken));
        } catch {
          clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [clearSession, persistSession]);

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
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);

    clearSession();

    if (token) {
      await logout(token).catch(() => undefined);
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isLoading,
      signIn,
      signUp,
      signOut
    }),
    [accessToken, isLoading, refreshToken, signIn, signOut, signUp, user]
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
