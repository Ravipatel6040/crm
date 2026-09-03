import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── authenticate ─────────────────────────────────────────────────────────────
// Reads access token from Authorization header OR httpOnly cookie.
// Attaches the full user document to req.user.

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Fallback to httpOnly cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Access token is required");
  }

  // 3. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Access token is expired or invalid");
  }

  // 4. Fetch user from DB
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (user.isArchived) {
    throw new ApiError(403, "User account has been removed");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "User account is not active");
  }

  req.user = user;
  next();
});

// ─── authorizeRoles ───────────────────────────────────────────────────────────
// Usage: authorizeRoles("ADMIN", "PROJECT_MANAGER")

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Not authenticated");
    }

    const userRole = String(req.user.role || "")
      .trim()
      .toUpperCase();

    const allowedRoles = roles.map((role) =>
      String(role).trim().toUpperCase()
    );

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        `Access denied. User role "${req.user.role}" is not allowed`
      );
    }

    next();
  };
};

export const verifyJWT = authenticate;