import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

const isProduction = process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const getDashboardPath = (role) => {
  const map = {
    ADMIN: "/dashboard",
    BD_SALES: "/dashboard",
    MARKETING: "/dashboard",
    PROJECT_MANAGER: "/dashboard",
    FINANCE: "/dashboard",
  };
  return map[role] ?? "/dashboard";
};

// ─── POST /api/v1/auth/login ───────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email (include password + refreshTokenHash)
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshTokenHash"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Account is inactive or suspended. Please contact administrator.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash refresh token before saving
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  const userDisplayName =
    user.name && user.name !== "User"
      ? user.name
      : user.role === "ADMIN"
      ? "Admin"
      : user.name || "User";

  const userData = {
    id: user._id,
    name: userDisplayName,
    email: user.email,
    role: user.role,
    designation: user.designation,
    phone: user.phone,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
  };

  return res
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          user: userData,
          admin: user.role === "ADMIN" ? userData : undefined,
          accessToken,
          refreshToken,
          redirectTo: getDashboardPath(user.role),
        },
        "Login successful"
      )
    );
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.refreshTokenHash) {
    throw new ApiError(401, "No refresh token session found. Please sign in again.");
  }

  const isMatch = await bcrypt.compare(
    incomingRefreshToken,
    user.refreshTokenHash
  );

  if (!isMatch) {
    // Possible token reuse attack — invalidate stored token
    user.refreshTokenHash = null;
    await user.save();
    throw new ApiError(401, "Invalid refresh token. Please sign in again.");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "User account is no longer active");
  }

  // Token rotation
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  const userDisplayName =
    user.name && user.name !== "User"
      ? user.name
      : user.role === "ADMIN"
      ? "Admin"
      : user.name || "User";

  const userData = {
    id: user._id,
    name: userDisplayName,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  return res
    .cookie("accessToken", newAccessToken, accessCookieOptions)
    .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: userData,
        },
        "Access token refreshed successfully"
      )
    );
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (incomingRefreshToken) {
    try {
      const decoded = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await User.findByIdAndUpdate(decoded.userId, {
        $set: { refreshTokenHash: null },
      });
    } catch {
      // Token may be invalid/expired, continue clearing cookies
    }
  } else if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshTokenHash: null },
    });
  }

  return res
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions)
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const userDisplayName =
    user.name && user.name !== "User"
      ? user.name
      : user.role === "ADMIN"
      ? "Admin"
      : user.name || "User";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        name: userDisplayName,
        email: user.email,
        role: user.role,
        designation: user.designation,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      "Current user retrieved successfully"
    )
  );
});
