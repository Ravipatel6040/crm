import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";
import { Lead } from "../models/lead.model.js";

function formatTimeAgo(date) {
  const now = new Date();
  const diffSec = Math.floor((now - new Date(date)) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// ─── 1. Get all notifications for current user ─────────────────────────────
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // If user has zero notifications, generate contextual initial notifications from real database data
  if (notifications.length === 0) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const followUpsToday = await Lead.find({
      $or: [{ assignedTo: userId }, { assignedTo: null }],
      nextFollowUp: { $gte: todayStart, $lte: todayEnd },
    }).limit(3).lean();

    const initialNotifs = [];

    followUpsToday.forEach((f) => {
      initialNotifs.push({
        user: userId,
        title: "Follow-up due today",
        message: `Scheduled follow-up with ${f.name} (${f.company || "Prospect"}) is due today.`,
        type: "FOLLOW_UP_DUE",
        link: "/follow-ups",
        read: false,
      });
    });

    const recentLeads = await Lead.find({
      $or: [{ assignedTo: userId }, { assignedTo: null }],
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    recentLeads.forEach((l) => {
      initialNotifs.push({
        user: userId,
        title: `Lead: ${l.name}`,
        message: `${l.company || "Prospect"} is currently in '${l.status}' stage with budget ₹${l.budget?.toLocaleString("en-IN") || "0"}.`,
        type: "LEAD_ASSIGNED",
        link: "/leads",
        read: false,
      });
    });

    initialNotifs.push({
      user: userId,
      title: "CRM System Notification",
      message: "Notification and sound alert system is active and running.",
      type: "SYSTEM",
      link: "/dashboard",
      read: true,
    });

    await Notification.insertMany(initialNotifs);

    notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  const result = notifications.map((n) => ({
    id: n._id.toString(),
    _id: n._id.toString(),
    title: n.title,
    message: n.message,
    desc: n.message,
    type: n.type,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt,
    time: formatTimeAgo(n.createdAt),
  }));

  return res.status(200).json(new ApiResponse(200, result, "Notifications fetched successfully"));
});

// ─── 2. Get unread notification count ──────────────────────────────────────
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await Notification.countDocuments({ user: userId, read: false });

  return res.status(200).json(new ApiResponse(200, { count }, "Unread notification count fetched"));
});

// ─── 3. Mark single notification as read ──────────────────────────────────
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notif = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: { read: true } },
    { new: true }
  );

  if (!notif) {
    return res.status(404).json(new ApiResponse(404, null, "Notification not found"));
  }

  return res.status(200).json(new ApiResponse(200, notif, "Notification marked as read"));
});

// ─── 4. Mark all notifications as read ────────────────────────────────────
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });

  return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

// ─── 5. Delete a notification ─────────────────────────────────────────────
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  await Notification.findOneAndDelete({ _id: id, user: userId });

  return res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
});

// Helper for other controllers to create notifications easily
export const createNotificationHelper = async ({ user, title, message, type = "GENERAL", link = "" }) => {
  try {
    if (!user || !title) return null;
    return await Notification.create({ user, title, message, type, link, read: false });
  } catch (err) {
    console.error("Error creating notification helper:", err);
    return null;
  }
};
