import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "participant" | "supervisor" | "organization" | "sponsor" | "admin";
  approved: boolean;
  walletAddress?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("cr_token"),
  setSession: (user, token) => {
    localStorage.setItem("cr_token", token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("cr_token");
    set({ user: null, token: null });
  },
}));
