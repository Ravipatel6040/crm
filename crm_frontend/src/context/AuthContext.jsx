import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loginUser, logout as logoutAction, updateTokens,
  selectCurrentUser, selectIsAuthenticated, selectAuthStatus, selectAuthError,
} from "../store/slices/authSlice";

/**
 * AuthContext.jsx
 * ----------------------------------------------------------------------
 * Auth state lives in Redux (see src/store/slices/authSlice.js).
 * AuthProvider synchronizes window events from Axios interceptors
 * (silent refresh, automatic logout) directly with the Redux store.
 */
export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      if (e.detail?.accessToken) {
        dispatch(
          updateTokens({
            accessToken: e.detail.accessToken,
            refreshToken: e.detail.refreshToken,
          })
        );
      }
    };

    const handleLogout = () => {
      dispatch(logoutAction());
    };

    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [dispatch]);

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
