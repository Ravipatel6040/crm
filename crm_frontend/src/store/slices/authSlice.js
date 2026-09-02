import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

function normalizeUser(userData) {
  if (!userData) return null;
  if (userData.role === "ADMIN" && (!userData.name || userData.name === "User")) {
    return { ...userData, name: "Admin" };
  }
  return userData;
}

function loadStoredUser() {
  try {
    const saved = localStorage.getItem("crm_user");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const user = normalizeUser(parsed);
    if (user && user.name !== parsed?.name) {
      localStorage.setItem("crm_user", JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}

const initialState = {
  user: loadStoredUser(),
  token: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

// Tries unified /auth/login first, then falls back to admin or user login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      let userData = null;
      let accessToken = null;
      let refreshToken = null;

      try {
        const res = await api.post("/auth/login", { email, password });
        const data = res.data.data || res.data;
        userData = normalizeUser(data.user || data.admin);
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
      } catch {
        try {
          const res = await api.post("/admin/login", { email, password });
          const data = res.data.data || res.data;
          userData = normalizeUser(data.admin || data.user);
          accessToken = data.accessToken;
          refreshToken = data.refreshToken;
        } catch {
          const res = await api.post("/users/login", { email, password });
          const data = res.data.data || res.data;
          userData = normalizeUser(data.user);
          accessToken = data.accessToken;
          refreshToken = data.refreshToken;
        }
      }

      return { user: userData, token: accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Invalid email or password");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = normalizeUser(action.payload.user);
      state.token = action.payload.token ?? state.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      state.status = "succeeded";
      state.error = null;
      if (action.payload.token) localStorage.setItem("accessToken", action.payload.token);
      if (action.payload.refreshToken) localStorage.setItem("refreshToken", action.payload.refreshToken);
      if (state.user) localStorage.setItem("crm_user", JSON.stringify(state.user));
    },
    updateTokens(state, action) {
      if (action.payload.accessToken) {
        state.token = action.payload.accessToken;
        localStorage.setItem("accessToken", action.payload.accessToken);
      }
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.status = "idle";
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("crm_user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const user = normalizeUser(action.payload.user);
        state.status = "succeeded";
        state.user = user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || state.refreshToken;
        if (action.payload.token) localStorage.setItem("accessToken", action.payload.token);
        if (action.payload.refreshToken) localStorage.setItem("refreshToken", action.payload.refreshToken);
        localStorage.setItem("crm_user", JSON.stringify(user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectCurrentRefreshToken = (state) => state.auth.refreshToken;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
