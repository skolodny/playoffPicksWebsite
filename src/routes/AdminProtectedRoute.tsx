import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../provider/authContext";

export const AdminProtectedRoute = () => {
    const { token, admin } = useContext(AuthContext);
  
    // Check if the user is authenticated
    if (!token || !admin) {
      // If not authenticated, redirect to the login page
      return <Navigate to="/login" />;
    }
  
    // If authenticated, render the child routes
    return <Outlet />;
  };