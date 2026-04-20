import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type PlanType = "Free" | "Basic" | "Premium" | "Anual";

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  avatar?: string;
  phone?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  isAdmin?: boolean;
  verified?: boolean;
}

interface AppContextType {
  user: User | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSessionId: (sessionId: string | null) => void;
  login: (user: User, sessionId: string, rememberMe?: boolean) => void;
  logout: () => void;
  updateUserLocation: (lat: number, lng: number) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: "mock-user-1",
  name: "Fazenda Santa Fé",
  email: "contato@santafe.com",
  plan: "Free",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("boi-na-rede-user");
    const savedSession = localStorage.getItem("boi-na-rede-session");
    const authState = localStorage.getItem("boi-na-rede-auth");
    const savedRememberMe = localStorage.getItem("boi-na-rede-remember");
    
    if (authState === "true" && savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser));
        setSessionId(savedSession);
        setRememberMe(savedRememberMe !== "false");
      } catch (error) {
        setUser(null);
        setSessionId(null);
      }
    } else {
      setUser(null);
      setSessionId(null);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever user/session changes
  useEffect(() => {
    if (isHydrated) {
      if (user && sessionId) {
        localStorage.setItem("boi-na-rede-user", JSON.stringify(user));
        localStorage.setItem("boi-na-rede-session", sessionId);
        localStorage.setItem("boi-na-rede-auth", "true");
      } else {
        localStorage.removeItem("boi-na-rede-user");
        localStorage.removeItem("boi-na-rede-session");
        localStorage.setItem("boi-na-rede-auth", "false");
      }
    }
  }, [user, sessionId, isHydrated]);

  // Auto logout on page close only if "remember me" is disabled
  useEffect(() => {
    // Only add the listener if user doesn't want to stay logged in
    if (rememberMe || !user) return;

    const handleBeforeUnload = () => {
      localStorage.removeItem("boi-na-rede-user");
      localStorage.removeItem("boi-na-rede-session");
      localStorage.setItem("boi-na-rede-auth", "false");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [rememberMe, user]);

  const login = (newUser: User, newSessionId: string, remember: boolean = true) => {
    setUser(newUser);
    setSessionId(newSessionId);
    setRememberMe(remember);
    localStorage.setItem("boi-na-rede-remember", remember ? "true" : "false");
  };

  const logout = () => {
    setUser(null);
    setSessionId(null);
  };

  const updateUserLocation = async (lat: number, lng: number) => {
    if (user && sessionId) {
      setUser({ ...user, latitude: lat, longitude: lng });
      try {
        await fetch("/api/users/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionId}`,
          },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
      } catch (error) {
        console.error("Failed to persist location:", error);
      }
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const refreshUser = async () => {
    const activeSessionId = sessionId || localStorage.getItem("boi-na-rede-session");
    if (!activeSessionId) return;
    try {
      const response = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${activeSessionId}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem("boi-na-rede-user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      sessionId,
      isAuthenticated: !!user && !!sessionId,
      setUser, 
      setSessionId,
      login,
      logout,
      updateUserLocation,
      updateUserProfile,
      refreshUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
