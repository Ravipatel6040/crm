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
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Helper: role → redirect path ────────────────────────────────────────────

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

// ─── POST /api/v1/admin/create ────────────────────────────────────────────────

export const createAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existingAdmin = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingAdmin) {
    throw new ApiError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await User.create({
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "ADMIN",
    status: "ACTIVE",
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      },
      "Admin created successfully"
    )
  );
});

// ─── POST /api/v1/admin/users/create ──────────────────────────────────────────

export const createUserAccount = asyncHandler(async (req, res) => {
  const { name, email, phone, designation, password, role, status } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  const validRoles = ["BD_SALES", "MARKETING", "PROJECT_MANAGER", "FINANCE", "ADMIN"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const existingUser = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const accountStatus = status ? status.toUpperCase() : "ACTIVE";

  const newUser = await User.create({
    name,
    email: email.toLowerCase().trim(),
    phone,
    designation,
    password: hashedPassword,
    role: role,
    status: accountStatus,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
        },
      },
      "User account created successfully"
    )
  );
});

// ─── GET /api/v1/admin/users ──────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: "ADMIN" } }).select("-password -refreshTokenHash").sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        designation: u.designation,
        role: u.role,
        status: u.status,
      })),
      "Users fetched successfully"
    )
  );
});

// ─── PATCH /api/v1/admin/users/:id ─────────────────────────────────────────────

export const updateUserAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, designation, role, status } = req.body;

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase().trim();
  if (phone) user.phone = phone;
  if (designation) user.designation = designation;
  if (role) user.role = role;
  if (status) user.status = status.toUpperCase();

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      "User updated successfully"
    )
  );
});

// ─── DELETE /api/v1/admin/users/:id ────────────────────────────────────────────

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

// ─── POST /api/v1/admin/login ─────────────────────────────────────────────────

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // 2. Find admin in DB (fetch password + refreshTokenHash)
  const admin = await User.findOne({
    email: email.toLowerCase().trim(),
    role: "ADMIN",
  }).select("+password +refreshTokenHash");

  if (!admin) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 3. Check account status
  if (admin.status !== "ACTIVE") {
    throw new ApiError(403, "Admin account is not active");
  }

  // 4. Verify password
  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 5. Generate tokens
  const accessToken = generateAccessToken(admin);
  const refreshToken = generateRefreshToken(admin);

  // 6. Hash refresh token before saving to DB (security best practice)
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // 7. Persist hashed refresh token + last login
  admin.refreshTokenHash = hashedRefreshToken;
  admin.lastLoginAt = new Date();
  await admin.save();

  // 8. Set cookies + respond
  return res
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          admin: {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            lastLoginAt: admin.lastLoginAt,
          },
          accessToken,
          redirectTo: getDashboard(admin.role),
        },
        "Admin login successful"
      )
    );
});

// ─── POST /api/v1/admin/refresh ───────────────────────────────────────────────

export const refreshAdminToken = asyncHandler(async (req, res) => {
  // Accept refresh token from cookie OR body
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  // 1. Verify JWT signature + expiry
  let decoded;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  // 2. Find admin in DB
  const admin = await User.findById(decoded.userId).select(
    "+refreshTokenHash"
  );

  if (!admin) {
    throw new ApiError(401, "Admin not found");
  }

  // 3. Compare incoming token with stored hash (refresh token rotation guard)
  if (!admin.refreshTokenHash) {
    throw new ApiError(401, "No refresh token on record — please log in again");
  }

  const isTokenValid = await bcrypt.compare(
    incomingRefreshToken,
    admin.refreshTokenHash
  );

  if (!isTokenValid) {
    // Possible token reuse attack — wipe the stored token
    admin.refreshTokenHash = null;
    await admin.save();
    throw new ApiError(401, "Refresh token is invalid — please log in again");
  }

  // 4. Check account still active
  if (admin.status !== "ACTIVE") {
    throw new ApiError(403, "Admin account is not active");
  }

  // 5. Rotate tokens
  const newAccessToken = generateAccessToken(admin);
  const newRefreshToken = generateRefreshToken(admin);
  const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

  admin.refreshTokenHash = newHashedRefreshToken;
  await admin.save();

  // 6. Respond with new tokens
  return res
    .cookie("accessToken", newAccessToken, accessCookieOptions)
    .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
        },
        "Access token refreshed successfully"
      )
    );
});

// ─── POST /api/v1/admin/logout ────────────────────────────────────────────────

export const adminLogout = asyncHandler(async (req, res) => {
  // req.user is set by authenticate middleware
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
    .json(new ApiResponse(200, null, "Admin logged out successfully"));
});

// ─── GET /api/v1/admin/me ─────────────────────────────────────────────────────

export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);

  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
      "Admin profile fetched"
    )
  );
});
