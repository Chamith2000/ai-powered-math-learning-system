import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { clearToken, getToken } from "./token";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const token = getToken();

    if (!token) {
      clearToken();
      setIsAuthenticated(false);
      return undefined;
    }

    const expiresAt = Number(localStorage.getItem("expiresAt") || 0);
    const remainingMs = Math.max(expiresAt - Date.now(), 0);

    const timeoutId = window.setTimeout(() => {
      clearToken();
      setIsAuthenticated(false);
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated]);

  return isAuthenticated ? children : <Navigate to="/authentication/login/creative" replace />;
};

export default PrivateRoute;
