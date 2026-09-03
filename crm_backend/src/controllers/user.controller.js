import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { User } from "../models/user.model.js";
import { Activity } from "../models/activity.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../utils/audit.js";
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
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
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
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
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

// ─── GET /api/v1/users/:id ────────────────────────────────────────────────────

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(id).select("-password -refreshTokenHash");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        status: user.status,
        isArchived: user.isArchived,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      "User fetched successfully"
    )
  );
});

// ─── PATCH /api/v1/users/:id/password ─────────────────────────────────────────
// A user changes their own password (current password required); an admin may
// set another user's password without it.

export const changeUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  if (!newPassword || String(newPassword).trim().length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const isSelf = String(req.user._id) === String(id);
  const isAdmin = req.user.role === "ADMIN";

  if (!isSelf && !isAdmin) {
    throw new ApiError(403, "You can only change your own password");
  }

  const user = await User.findById(id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  if (isSelf) {
    if (!currentPassword) {
      throw new ApiError(400, "Current password is required");
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new ApiError(401, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(String(newPassword).trim(), 10);
  // Force a fresh sign-in everywhere after a password change.
  user.refreshTokenHash = null;
  await user.save();

  await logAudit(req, {
    entityType: "User",
    entityId: user._id,
    entityLabel: user.name,
    action: "PASSWORD_RESET",
    content: isSelf
      ? `${user.name} changed their own password`
      : `Password reset for ${user.name} (${user.email})`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

// ─── GET /api/v1/users/:id/activity ───────────────────────────────────────────
// Everything this user did, from the audit trail.

export const getUserActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const isSelf = String(req.user._id) === String(id);
  if (!isSelf && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Not allowed to view this user's activity");
  }

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const activities = await Activity.find({ createdBy: id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      activities.map((a) => ({
        id: a._id.toString(),
        type: a.type,
        action: a.action,
        entityType: a.entityType,
        entityLabel: a.entityLabel,
        content: a.content,
        createdAt: a.createdAt,
      })),
      "User activity fetched successfully"
    )
  );
});