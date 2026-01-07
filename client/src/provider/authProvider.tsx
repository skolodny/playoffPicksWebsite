import { useMemo, useState } from "react";
import { ReactNode } from "react";
import { AuthContext } from "./authContext";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem("token"));
  const [current, setCurrent_] = useState('h');
  const [admin, setAdmin] = useState(false);

  // Function to set the authentication token
  const setToken = (newToken: string | null, admin: boolean) => {
    setToken_(newToken);
    setAdmin(admin);
    if (newToken === null) {
      localStorage.removeItem("token");
      return;
    }
    localStorage.setItem("token", newToken);
  };

  const setCurrent = (key: string) => {
    setCurrent_(key);
  };

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
      current,
      setCurrent,
      admin
    }),
    [token, current, admin]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
