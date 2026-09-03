import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { User } from "../models/user.model.js";
import { Lead } from "../models/lead.model.js";
import { Client } from "../models/client.model.js";
import { Project } from "../models/project.model.js";
import { Activity } from "../models/activity.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit, diffSummary } from "../utils/audit.js";
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
    ADMIN: "/dashboard",
    BD_SALES: "/dashboard",
    MARKETING: "/dashboard",
    PROJECT_MANAGER: "/dashboard",
    FINANCE: "/dashboard",
  };
  return map[role] ?? "/dashboard";
};

// ─── POST /api/v1/admin/create ────────────────────────────────────────────────
// Bootstrap-only. Once the first admin exists this endpoint is closed; further
// admins are created by a signed-in admin through POST /admin/users/create.
// A non-empty ADMIN_BOOTSTRAP_SECRET in the environment is additionally
// required to match the x-bootstrap-secret header.

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  if (String(password).length < 8) {
    throw new ApiError(400, "Admin password must be at least 8 characters");
  }

  const adminCount = await User.countDocuments({ role: "ADMIN" });
  if (adminCount > 0) {
    throw new ApiError(
      403,
      "An administrator already exists. Sign in as an admin to create additional accounts."
    );
  }

  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (bootstrapSecret && req.headers["x-bootstrap-secret"] !== bootstrapSecret) {
    throw new ApiError(403, "Invalid bootstrap secret");
  }

  const existingAdmin = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingAdmin) {
    throw new ApiError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await User.create({
    name: name?.trim() || "Admin",
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

  await logAudit(req, {
    entityType: "User",
    entityId: newUser._id,
    entityLabel: newUser.name,
    action: "CREATE",
    content: `Created ${role} account for ${newUser.name} (${newUser.email})`,
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
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Archived accounts are hidden unless explicitly asked for.
  if (req.query.includeArchived !== "true") {
    filter.isArchived = { $ne: true };
  }

  if (req.query.search) {
    const term = String(req.query.search).trim();
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
    ];
  }

  // Opt-in pagination: callers that populate assignee dropdowns omit `page`
  // and still get the full list.
  const isPaged = req.query.page !== undefined;
  const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));

  const query = User.find(filter)
    .select("-password -refreshTokenHash")
    .sort({ createdAt: -1 });

  if (isPaged) {
    query.skip((pageNum - 1) * pageSize).limit(pageSize);
  }

  const [users, total] = await Promise.all([
    query.exec(),
    isPaged ? User.countDocuments(filter) : Promise.resolve(null),
  ]);

  const response = new ApiResponse(
    200,
    users.map(u => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      designation: u.designation,
      role: u.role,
      status: u.status,
      isArchived: u.isArchived,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    })),
    "Users fetched successfully"
  );

  if (isPaged) {
    Object.assign(response, {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }

  return res.status(200).json(response);
});

// ─── PATCH /api/v1/admin/users/:id ─────────────────────────────────────────────

export const updateUserAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, designation, role, status, password } = req.body;

  const user = await User.findById(id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const before = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    designation: user.designation,
    role: user.role,
    status: user.status,
  };

  // Guard against locking everyone out of the admin panel.
  const isDemotion = role && role !== "ADMIN" && user.role === "ADMIN";
  const isDeactivation =
    status && status.toUpperCase() !== "ACTIVE" && user.role === "ADMIN";

  if (isDemotion || isDeactivation) {
    const activeAdmins = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
      isArchived: { $ne: true },
      _id: { $ne: user._id },
    });
    if (activeAdmins === 0) {
      throw new ApiError(
        400,
        "This is the last active administrator. Promote another admin before changing this account."
      );
    }
  }

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase().trim();
  if (phone !== undefined) user.phone = phone;
  if (designation !== undefined) user.designation = designation;
  if (role) user.role = role;

  if (status) {
    const nextStatus = status.toUpperCase();
    // Losing ACTIVE ends any live session rather than leaving the stored
    // refresh token usable if the account is re-enabled later.
    if (nextStatus !== "ACTIVE" && user.status === "ACTIVE") {
      user.refreshTokenHash = null;
    }
    user.status = nextStatus;
  }

  let passwordChanged = false;
  if (password && typeof password === "string" && password.trim().length >= 6) {
    user.password = await bcrypt.hash(password.trim(), 10);
    user.refreshTokenHash = null;
    passwordChanged = true;
  }

  await user.save();

  const summary = diffSummary(before, { name, email, phone, designation, role, status: status?.toUpperCase() }, [
    "name", "email", "phone", "designation", "role", "status",
  ]);

  await logAudit(req, {
    entityType: "User",
    entityId: user._id,
    entityLabel: user.name,
    action: passwordChanged && !summary ? "PASSWORD_RESET" : "UPDATE",
    content:
      [
        summary && `Updated ${user.name} — ${summary}`,
        passwordChanged && `Reset password for ${user.name}`,
      ]
        .filter(Boolean)
        .join(". ") || `Updated ${user.name}`,
  });

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

// ─── GET /api/v1/admin/users/:id/workload ─────────────────────────────────────
// What a user still owns, so the UI can ask where to move it before archiving.

export const getUserWorkload = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const [leads, clients, projects] = await Promise.all([
    Lead.countDocuments({ assignedTo: id, isArchived: { $ne: true } }),
    Client.countDocuments({ accountManager: id }),
    Project.countDocuments({ projectManager: id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { leads, clients, projects, total: leads + clients + projects },
      "User workload fetched"
    )
  );
});

// ─── POST /api/v1/admin/users/:id/force-logout ────────────────────────────────

export const forceLogoutUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { refreshTokenHash: null } },
    { new: true }
  );

  if (!user) throw new ApiError(404, "User not found");

  await logAudit(req, {
    entityType: "User",
    entityId: user._id,
    entityLabel: user.name,
    action: "FORCE_LOGOUT",
    content: `Force-signed out ${user.name} (${user.email})`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, `${user.name} has been signed out of all devices`));
});

// ─── DELETE /api/v1/admin/users/:id ────────────────────────────────────────────

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reassignTo } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  if (String(req.user._id) === String(id)) {
    throw new ApiError(400, "You cannot remove your own account");
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "ADMIN") {
    const activeAdmins = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
      isArchived: { $ne: true },
      _id: { $ne: user._id },
    });
    if (activeAdmins === 0) {
      throw new ApiError(400, "Cannot remove the last active administrator");
    }
  }

  // Move everything this user owns before archiving them, so no lead, client
  // or project is left pointing at an account nobody can see.
  let successor = null;
  if (reassignTo) {
    if (!mongoose.Types.ObjectId.isValid(reassignTo)) {
      throw new ApiError(400, "Invalid reassignment target");
    }
    successor = await User.findById(reassignTo);
    if (!successor || successor.isArchived) {
      throw new ApiError(400, "Reassignment target is not an active user");
    }
  }

  const successorId = successor ? successor._id : null;
  const [leads, clients, projects] = await Promise.all([
    Lead.updateMany({ assignedTo: user._id }, { $set: { assignedTo: successorId } }),
    Client.updateMany({ accountManager: user._id }, { $set: { accountManager: successorId } }),
    Project.updateMany({ projectManager: user._id }, { $set: { projectManager: successorId } }),
  ]);

  const moved =
    (leads.modifiedCount || 0) +
    (clients.modifiedCount || 0) +
    (projects.modifiedCount || 0);

  // Archive rather than delete: audit rows and historical records still need
  // to resolve this user's name.
  user.isArchived = true;
  user.archivedAt = new Date();
  user.status = "INACTIVE";
  user.refreshTokenHash = null;
  await user.save();

  await logAudit(req, {
    entityType: "User",
    entityId: user._id,
    entityLabel: user.name,
    action: "DELETE",
    content:
      `Archived account ${user.name} (${user.email})` +
      (moved
        ? `. Reassigned ${moved} record(s) to ${successor ? successor.name : "Unassigned"}`
        : ""),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reassigned: {
          leads: leads.modifiedCount || 0,
          clients: clients.modifiedCount || 0,
          projects: projects.modifiedCount || 0,
        },
        reassignedTo: successor ? { id: successor._id, name: successor.name } : null,
      },
      moved
        ? `Account archived. ${moved} record(s) reassigned to ${successor ? successor.name : "Unassigned"}.`
        : "Account archived successfully"
    )
  );
});

// ─── GET /api/v1/admin/audit-logs ─────────────────────────────────────────────

export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const { entityType, action, user: userId, search } = req.query;

  const filter = { type: "Audit" };
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.createdBy = userId;
  if (search) filter.content = { $regex: String(search).trim(), $options: "i" };

  const [items, total] = await Promise.all([
    Activity.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: items.map((a) => ({
          id: a._id.toString(),
          action: a.action,
          entityType: a.entityType,
          entityLabel: a.entityLabel,
          content: a.content,
          ip: a.ip,
          actor: a.createdBy
            ? { id: a.createdBy._id.toString(), name: a.createdBy.name, role: a.createdBy.role }
            : { id: null, name: a.actorName || "System", role: a.actorRole || "" },
          createdAt: a.createdAt,
        })),
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      "Audit logs fetched successfully"
    )
  );
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
            name: (admin.name && admin.name !== "User") ? admin.name : "Admin",
            email: admin.email,
            role: admin.role,
            lastLoginAt: admin.lastLoginAt,
          },
          accessToken,
          refreshToken,
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
          refreshToken: newRefreshToken,
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
