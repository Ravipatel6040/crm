import { useDispatch, useSelector } from "react-redux";
import {
  loginUser, logout as logoutAction,
  selectCurrentUser, selectIsAuthenticated, selectAuthStatus, selectAuthError,
} from "../store/slices/authSlice";

/**
 * AuthContext.jsx
 * ----------------------------------------------------------------------
 * Auth state now lives in Redux (see src/store/slices/authSlice.js) so it
 * can be read from anywhere in the store (RTK Query headers, thunks,
 * dashboards, etc) instead of being locked inside a React Context tree.
 *
 * `AuthProvider` is kept as a harmless passthrough and `useAuth()` keeps
 * its original signature ({ user, login, logout, loading, isAuthenticated,
 * error }) purely so none of the existing components that already call
 * `useAuth()` (Navbar, Sidebar, ProtectedRoute, Login, Profile, Settings,
 * Dashboard...) need to change. Internally it's 100% Redux.
 */
export function AuthProvider({ children }) {
  return children;
}

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const login = async ({ email, password }) => {
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.rejected.match(result)) {
      throw new Error(result.payload || "Login failed");
    }
    return true;
  };

  const logout = () => dispatch(logoutAction());

  return { user, login, logout, loading: status === "loading", isAuthenticated, error };
}
