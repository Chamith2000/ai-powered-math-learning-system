import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  clearStudentSession,
  getStudentSessionRemainingMs,
  hasValidStudentSession,
} from "./auth";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    hasValidStudentSession()
  );

  useEffect(() => {
    if (!hasValidStudentSession()) {
      clearStudentSession();
      setIsAuthenticated(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearStudentSession();
      setIsAuthenticated(false);
    }, getStudentSessionRemainingMs());

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated]);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
