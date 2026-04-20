import { useEffect } from "react";
import { useAppContext, User } from "@/context/AppContext";

export function useAuth() {
  const { user, setUser } = useAppContext();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("boi-na-rede-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        // Silent fail - localStorage may be corrupted
      }
    }
  }, [setUser]);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("boi-na-rede-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("boi-na-rede-user");
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("boi-na-rede-user");
  };

  return { user, setUser, logout, isAuthenticated: !!user };
}
