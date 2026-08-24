import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";

// ─── Cookie options ───────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const getDashboard = (role) => {
  const map = {
    ADMIN: "/admin/dashboard",
    BD_SALES: "/sales/dashboard",
    MARKETING: "/marketing/dashboard",
    PROJECT_MANAGER: "/pm/dashboard",
    FINANCE: "/finance/dashboard",
  };
  return map[role] ?? "/dashboard";
};

// ─── POST /api/v1/users/login ─────────────────────────────────────────────────

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password +refreshTokenHash");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Account is not active");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash refresh token before storing
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  return res
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
          },
          accessToken,
          redirectTo: getDashboard(user.role),
        },
        "Login successful"
      )
    );
});

// ─── POST /api/v1/users/refresh ───────────────────────────────────────────────

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!user.refreshTokenHash) {
    throw new ApiError(401, "No refresh token on record — please log in again");
  }

  const isValid = await bcrypt.compare(
    incomingRefreshToken,
    user.refreshTokenHash
  );

  if (!isValid) {
    user.refreshTokenHash = null;
    await user.save();
    throw new ApiError(401, "Refresh token is invalid — please log in again");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Account is not active");
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return res
    .cookie("accessToken", newAccessToken, accessCookieOptions)
    .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        "Access token refreshed"
      )
    );
});

// ─── POST /api/v1/users/logout ────────────────────────────────────────────────

export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshTokenHash: null } },
      { new: true }
    );
  }

  return res
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions)
    .status(200)
    .json(new ApiResponse(200, null, "Logout successful"));
});