import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); // Required to parse httpOnly cookies

// ─── Routes ───────────────────────────────────────────────────────────────────

import { adminRoutes } from "./routes/admin.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { leadRoutes } from "./routes/lead.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";

// Home
app.get("/", (req, res) => res.json({ msg: "CRM API is running 🚀" }));

// Admin auth  →  /api/v1/admin/login | /refresh | /logout | /me
app.use("/api/v1/admin", adminRoutes);
// General user routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);





// Health check
app.use(healthRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.all("{*path}", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global error middleware (must be last) ───────────────────────────────────

app.use(errorMiddleware);

export { app as Server };
