import { createContext } from "react";

export const AuthContext = createContext<{
  token: string | null;
  setToken: (newToken: string) => void;
}>({
  token: null,
  setToken: () => {}
});