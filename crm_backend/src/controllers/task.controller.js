import mongoose from "mongoose";
import { Task } from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotificationHelper } from "./notification.controller.js";

const formatTask = (t) => ({
  id: t._id.toString(),
  title: t.title,
  project: t.project?.toString ? t.project.toString() : t.project,
  assignedTo: t.assignedTo?._id?.toString() || t.assignedTo?.toString?.() || null,
  assignedToName: t.assignedTo?.name || null,
  status: t.status,
  dueDate: t.dueDate,
  priority: t.priority,
  description: t.description,
  createdAt: t.createdAt,
});

// ─── GET /api/v1/projects/:projectId/tasks ────────────────────────────────────
export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const tasks = await Task.find({ project: projectId })
    .populate("assignedTo", "name email")
    .sort({ dueDate: 1 });

  return res.status(200).json(new ApiResponse(200, tasks.map(formatTask), "Tasks fetched successfully"));
});

// ─── POST /api/v1/projects/:projectId/tasks ───────────────────────────────────
export const createProjectTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, assignedTo, dueDate, priority, description, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }
  if (!title?.trim()) {
    throw new ApiError(400, "Task title is required");
  }
  if (!dueDate) {
    throw new ApiError(400, "Due date is required");
  }
  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new ApiError(400, "Invalid assignee");
  }

  const task = await Task.create({
    title: title.trim(),
    project: projectId,
    assignedTo: assignedTo || null,
    dueDate: new Date(dueDate),
    priority: priority || "Medium",
    description: description || "",
    status: status || "TODO",
  });

  if (assignedTo) {
    await createNotificationHelper({
      user: assignedTo,
      title: "New Task Assigned",
      message: `You were assigned "${task.title}", due ${new Date(task.dueDate).toLocaleDateString()}.`,
      type: "GENERAL",
      link: "/tasks",
    });
  }

  const populated = await Task.findById(task._id).populate("assignedTo", "name email");
  return res.status(201).json(new ApiResponse(201, formatTask(populated), "Task created successfully"));
});

// ─── PATCH /api/v1/projects/:projectId/tasks/:taskId ──────────────────────────
export const updateProjectTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, assignedTo, dueDate, priority, description, status } = req.body;

  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new ApiError(400, "Invalid assignee");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (title !== undefined) task.title = title.trim();
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
  if (dueDate !== undefined) task.dueDate = new Date(dueDate);
  if (priority !== undefined) task.priority = priority;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;

  await task.save();

  const populated = await Task.findById(task._id).populate("assignedTo", "name email");
  return res.status(200).json(new ApiResponse(200, formatTask(populated), "Task updated successfully"));
});

// ─── DELETE /api/v1/projects/:projectId/tasks/:taskId ─────────────────────────
export const deleteProjectTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
});
