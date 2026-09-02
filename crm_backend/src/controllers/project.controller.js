import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { Requirement } from "../models/requirement.model.js";
import { User } from "../models/user.model.js";
import { createNotificationHelper } from "./notification.controller.js";

// ─── 1. Get Projects ────────────────────────────────────────────────────────
export const getProjects = asyncHandler(async (req, res) => {
  const user = req.user;
  let filter = {};

  if (user.role === "PROJECT_MANAGER") {
    filter = {
      $or: [
        { projectManager: user._id },
        { teamMembers: user._id },
        { projectManager: null }, // unassigned projects available to pick
      ],
    };
  }

  const projects = await Project.find(filter)
    .populate("projectManager", "name email designation role")
    .populate("client", "name company email phone")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const formatted = projects.map((p) => ({
    id: p._id.toString(),
    _id: p._id.toString(),
    name: p.name,
    client: p.client?._id?.toString() || p.client,
    clientName: p.clientName || p.client?.name || p.client?.company || "Direct Client",
    status: p.status,
    stage: p.stage || (p.status === "Completed" ? "Completed" : (["Planning", "Requirements", "Development", "Testing", "Client Review"].includes(p.status) ? p.status : "Development")),
    projectManager: p.projectManager?._id?.toString() || (typeof p.projectManager === "string" ? p.projectManager : null),
    manager: p.projectManager?._id?.toString() || (typeof p.projectManager === "string" ? p.projectManager : null),
    managerName: p.projectManager?.name || (typeof p.projectManager === "string" ? "Assigned" : "Unassigned"),
    projectManagerObj: p.projectManager || null,
    createdBy: p.createdBy?._id?.toString() || p.createdBy,
    createdByName: p.createdBy?.name || "BDE/Sales",
    priority: p.priority,
    startDate: p.startDate || p.createdAt,
    deadline: p.deadline,
    notes: p.notes,
    link: p.link,
    documents: p.documents || [],
    createdAt: p.createdAt,
    tasks: { total: 0, done: 0 },
    progress: p.status === "Completed" ? 100 : (p.status === "Testing" ? 75 : (p.status === "Development" ? 50 : 0)),
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Projects fetched successfully"));
});

// ─── 1.1 Get Project By ID ──────────────────────────────────────────────────
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let project = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    project = await Project.findById(id)
      .populate("projectManager", "name email designation role")
      .populate("client", "name company email phone")
      .populate("createdBy", "name email role")
      .lean();
  }
  if (!project) {
    project = await Project.findOne({ _id: id })
      .populate("projectManager", "name email designation role")
      .populate("client", "name company email phone")
      .populate("createdBy", "name email role")
      .lean();
  }

  if (!project) {
    return res.status(404).json(new ApiResponse(404, null, "Project not found"));
  }

  const formatted = {
    ...project,
    id: project._id.toString(),
    _id: project._id.toString(),
    clientName: project.clientName || project.client?.name || project.client?.company || "Direct Client",
    status: project.status,
    stage: project.stage || (project.status === "Completed" ? "Completed" : (["Planning", "Requirements", "Development", "Testing", "Client Review"].includes(project.status) ? project.status : "Development")),
    managerName: project.projectManager?.name || "Unassigned",
    manager: project.projectManager?._id?.toString() || project.projectManager || null,
    projectManager: project.projectManager?._id?.toString() || project.projectManager || null,
    projectManagerObj: project.projectManager || null,
    createdByObj: project.createdBy || null,
    createdByName: project.createdBy?.name || "BDE/Sales",
    documents: project.documents || [],
    startDate: project.startDate || project.createdAt,
    tasks: { total: 0, done: 0 },
    progress: project.status === "Completed" ? 100 : (project.status === "Testing" ? 75 : (project.status === "Development" ? 50 : 0)),
  };

  return res.status(200).json(new ApiResponse(200, formatted, "Project fetched successfully"));
});

// ─── 2. Create Project ──────────────────────────────────────────────────────
export const createProject = asyncHandler(async (req, res) => {
  const {
    name,
    client,
    clientName,
    status = "Planning",
    stage,
    projectManager,
    priority = "Medium",
    startDate,
    deadline,
    notes = "",
    requirements = [],
    documents = [],
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json(new ApiResponse(400, null, "Project name is required"));
  }

  const project = await Project.create({
    name: name.trim(),
    client: client || null,
    clientName: clientName?.trim() || "",
    status: stage || status,
    stage: stage || (["Planning", "Requirements", "Development", "Testing", "Client Review", "Completed"].includes(status) ? status : "Planning"),
    projectManager: projectManager || null,
    priority,
    startDate: startDate ? new Date(startDate) : new Date(),
    deadline: deadline ? new Date(deadline) : null,
    notes: notes?.trim() || "",
    documents: Array.isArray(documents) ? documents : [],
    createdBy: req.user._id,
  });

  // If initial requirements were submitted with the project
  if (Array.isArray(requirements) && requirements.length > 0) {
    const reqDocs = requirements.map((r) => ({
      title: typeof r === "string" ? r : r.title,
      description: typeof r === "object" ? r.description || "" : "",
      project: project._id,
      projectName: project.name,
      category: typeof r === "object" ? r.category || "Feature" : "Feature",
      priority: typeof r === "object" ? r.priority || priority : priority,
      status: "In Progress",
      assignedTo: projectManager || null,
      createdBy: req.user._id,
    }));
    await Requirement.insertMany(reqDocs);
  }

  // Send real notification to assigned Project Manager
  if (projectManager) {
    await createNotificationHelper({
      user: projectManager,
      title: "New Project Assigned",
      message: `You have been assigned as Project Manager for "${project.name}" by ${req.user.name || "BDE/Sales"}.`,
      type: "GENERAL",
      link: "/projects",
    });
  }

  const populated = await Project.findById(project._id)
    .populate("projectManager", "name email role")
    .populate("client", "name company")
    .lean();

  return res.status(201).json(new ApiResponse(201, {
    id: populated._id.toString(),
    _id: populated._id.toString(),
    name: populated.name,
    client: populated.client?._id?.toString() || populated.client,
    clientName: populated.clientName || populated.client?.name || populated.client?.company || "Direct Client",
    status: populated.status,
    projectManager: populated.projectManager?._id?.toString() || null,
    managerName: populated.projectManager?.name || "Unassigned",
    priority: populated.priority,
    deadline: populated.deadline,
    notes: populated.notes,
  }, "Project created and assigned successfully"));
});

// ─── 3. Update Project ──────────────────────────────────────────────────────
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let project = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    project = await Project.findById(id);
  }
  if (!project) {
    project = await Project.findOne({ _id: id });
  }

  if (!project) {
    return res.status(404).json(new ApiResponse(404, null, "Project not found"));
  }

  const previousManager = project.projectManager?.toString();

  const allowedFields = ["name", "client", "clientName", "status", "stage", "projectManager", "priority", "startDate", "deadline", "notes", "link", "documents"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "startDate" || field === "deadline") {
        project[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else {
        project[field] = req.body[field];
      }
    }
  });

  if (req.body.stage) {
    project.status = req.body.stage;
  } else if (req.body.status && ["Planning", "Requirements", "Development", "Testing", "Client Review", "Completed"].includes(req.body.status)) {
    project.stage = req.body.status;
  }

  await project.save();

  // If Project Manager was newly assigned or changed, alert them
  if (project.projectManager && project.projectManager.toString() !== previousManager) {
    await createNotificationHelper({
      user: project.projectManager,
      title: "Project Assigned to You",
      message: `You are now assigned as Project Manager for "${project.name}".`,
      type: "GENERAL",
      link: "/projects",
    });
  }

  const populated = await Project.findById(project._id)
    .populate("projectManager", "name email role")
    .populate("client", "name company")
    .lean();

  return res.status(200).json(new ApiResponse(200, {
    ...populated,
    id: populated._id.toString(),
    _id: populated._id.toString(),
  }, "Project updated successfully"));
});

// ─── 4. Delete Project ──────────────────────────────────────────────────────
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (mongoose.Types.ObjectId.isValid(id)) {
    await Project.findByIdAndDelete(id);
  } else {
    await Project.findOneAndDelete({ _id: id });
  }
  await Requirement.deleteMany({ project: id });

  return res.status(200).json(new ApiResponse(200, null, "Project deleted successfully"));
});

// ─── 5. Requirements: Get All ──────────────────────────────────────────────
export const getRequirements = asyncHandler(async (req, res) => {
  const { project } = req.query;
  const filter = project ? { project } : {};

  const requirements = await Requirement.find(filter)
    .populate("project", "name clientName status priority")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const formatted = requirements.map((r) => ({
    id: r._id.toString(),
    _id: r._id.toString(),
    title: r.title,
    description: r.description,
    project: r.project?._id?.toString() || r.project,
    projectName: r.projectName || r.project?.name || "Unassigned Project",
    category: r.category,
    priority: r.priority,
    status: r.status,
    completed: r.completed,
    assignedTo: r.assignedTo?._id?.toString() || null,
    managerName: r.assignedTo?.name || "Unassigned",
    createdAt: r.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Requirements fetched successfully"));
});

// ─── 6. Requirements: Create ───────────────────────────────────────────────
export const createRequirement = asyncHandler(async (req, res) => {
  const { title, description = "", project, projectName = "", category = "Feature", priority = "High", status = "In Progress", assignedTo } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json(new ApiResponse(400, null, "Requirement title is required"));
  }

  let finalProjectName = projectName;
  let finalManager = assignedTo;

  if (project) {
    const projDoc = await Project.findById(project).populate("projectManager", "_id name");
    if (projDoc) {
      finalProjectName = projDoc.name;
      if (!finalManager && projDoc.projectManager) {
        finalManager = projDoc.projectManager._id;
      }
    }
  }

  const requirement = await Requirement.create({
    title: title.trim(),
    description: description.trim(),
    project: project || null,
    projectName: finalProjectName,
    category,
    priority,
    status,
    completed: status === "Approved",
    assignedTo: finalManager || null,
    createdBy: req.user._id,
  });

  // Notify Project Manager if assigned
  if (finalManager) {
    await createNotificationHelper({
      user: finalManager,
      title: "New Requirement Added",
      message: `Requirement "${requirement.title}" added to project "${finalProjectName}".`,
      type: "GENERAL",
      link: "/requirements",
    });
  }

  return res.status(201).json(new ApiResponse(201, requirement, "Requirement created successfully"));
});

// ─── 7. Requirements: Update ───────────────────────────────────────────────
export const updateRequirement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requirement = await Requirement.findById(id);

  if (!requirement) {
    return res.status(404).json(new ApiResponse(404, null, "Requirement not found"));
  }

  const allowedFields = ["title", "description", "category", "priority", "status", "completed", "assignedTo", "projectName", "project"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      requirement[field] = req.body[field];
    }
  });

  if (req.body.completed !== undefined) {
    requirement.status = req.body.completed ? "Approved" : "In Progress";
  }

  await requirement.save();

  return res.status(200).json(new ApiResponse(200, requirement, "Requirement updated successfully"));
});

// ─── 8. Requirements: Delete ───────────────────────────────────────────────
export const deleteRequirement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Requirement.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, null, "Requirement deleted successfully"));
});

// ─── 9. Get Project Managers ───────────────────────────────────────────────
export const getProjectManagers = asyncHandler(async (req, res) => {
  const managers = await User.find({
    role: { $in: ["PROJECT_MANAGER", "ADMIN"] },
  })
    .select("_id name email role designation")
    .sort({ name: 1 })
    .lean();

  const formatted = managers.map((m) => ({
    id: m._id.toString(),
    _id: m._id.toString(),
    name: m.name,
    email: m.email,
    role: m.role,
    designation: m.designation || (m.role === "ADMIN" ? "Administrator" : "Project Manager"),
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Project managers fetched successfully"));
});
