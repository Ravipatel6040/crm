import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess } from "../constants/roles";

// Wraps the whole authenticated app: redirects to /login if not authenticated.
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Wraps an individual route: redirects to /dashboard if the role can't access it.
export function RequirePermission({ routeKey, children }) {
  const { user } = useAuth();
  // Pass the whole user so server-issued permissions take priority over the
  // static fallback matrix.
  const isAllowed =
    canAccess(user, routeKey) ||
    (routeKey === "leads" && canAccess(user, "my_leads")) ||
    (routeKey === "my_leads" && canAccess(user, "leads"));

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
