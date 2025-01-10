import { createContext } from "react";

export const AuthContext = createContext<{
  token: string | null;
  setToken: (newToken: string) => void;
  current: string;
  setCurrent: (key: string) => void;
}>({
  token: null,
  setToken: () => {},
  current: 'h',
  setCurrent: () => {}
});