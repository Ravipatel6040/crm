import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

function loadStoredUser() {
  try {
    const saved = localStorage.getItem("crm_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

const initialState = {
  user: loadStoredUser(),
  token: localStorage.getItem("accessToken") || null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

// Tries the admin login endpoint first, then falls back to the regular
// user login endpoint — mirrors the previous AuthContext behaviour.
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      let userData = null;
      let accessToken = null;

      try {
        const res = await api.post("/admin/login", { email, password });
        const data = res.data.data;
        userData = data.admin || data.user;
        accessToken = data.accessToken;
      } catch {
        const res = await api.post("/users/login", { email, password });
        const data = res.data.data;
        userData = data.user;
        accessToken = data.accessToken;
      }

      return { user: userData, token: accessToken };
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
      state.user = action.payload.user;
      state.token = action.payload.token ?? state.token;
      state.status = "succeeded";
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      localStorage.removeItem("accessToken");
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
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (action.payload.token) localStorage.setItem("accessToken", action.payload.token);
        localStorage.setItem("crm_user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
