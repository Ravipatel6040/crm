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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser()); // Required to parse httpOnly cookies

// ─── Routes ───────────────────────────────────────────────────────────────────

import { authRoutes } from "./routes/auth.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { leadRoutes } from "./routes/lead.routes.js";
import { clientRoutes } from "./routes/client.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { marketingRoutes } from "./routes/marketing.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { projectRoutes } from "./routes/project.routes.js";
import { settingsRoutes } from "./routes/settings.routes.js";
import { invoiceRouter, paymentRouter, expenseRouter } from "./routes/finance.routes.js";

// Home
app.get("/", (req, res) => res.json({ msg: "CRM API is running 🚀" }));

// Unified auth routes → /api/v1/auth/login | /refresh | /logout | /me
app.use("/api/v1/auth", authRoutes);
// Admin auth & management → /api/v1/admin
app.use("/api/v1/admin", adminRoutes);
// General user routes → /api/v1/users
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/marketing", marketingRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/expenses", expenseRouter);





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
