import mongoose from "mongoose";
import { Lead } from "../models/lead.model.js";
import { Activity } from "../models/activity.model.js";
import { createNotificationHelper } from "./notification.controller.js";

const generateLeadId = async () => {
  let leadId;
  let exists = true;

  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000);
    leadId = `L-${random}`;

    exists = await Lead.exists({ leadId });
  }

  return leadId;
};


// ======================================================
// CREATE LEAD
// ======================================================

export const createLead = async (req, res, next) => {
  try {
    const {
      name,
      company,
      phone,
      email,
      source,
      interestedIn,
      budget,
      assignedTo,
      status,
      nextFollowUp,
      notes,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!company?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (
      assignedTo &&
      !mongoose.Types.ObjectId.isValid(assignedTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid assigned user",
      });
    }

    const leadId = await generateLeadId();

    const lead = await Lead.create({
      leadId,
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      source: source || "Website",
      interestedIn: interestedIn || "",
      budget: Number(budget) || 0,
      assignedTo: assignedTo || null,
      status: status || "New",
      nextFollowUp: nextFollowUp || null,
      notes: notes || "",
      createdBy: req.user?._id || null,
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    await Activity.create({
      leadId: lead._id,
      type: "System",
      content: "Lead created",
      createdBy: req.user?._id || null,
    });

    const notifyUser = lead.assignedTo || req.user?._id;
    if (notifyUser) {
      await createNotificationHelper({
        user: notifyUser,
        title: "New Lead Created",
        message: `${lead.name} (${lead.company}) was added with status '${lead.status}'.`,
        type: "LEAD_CREATED",
        link: "/leads",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: {
        id: populatedLead.leadId,
        name: populatedLead.name,
        company: populatedLead.company,
        phone: populatedLead.phone,
        email: populatedLead.email,
        source: populatedLead.source,
        interestedIn: populatedLead.interestedIn,
        budget: populatedLead.budget,
        assignedTo:
          populatedLead.assignedTo?._id?.toString() || null,
        status: populatedLead.status,
        nextFollowUp: populatedLead.nextFollowUp,
        notes: populatedLead.notes,
        createdAt: populatedLead.createdAt,
        updatedAt: populatedLead.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET ALL LEADS
// ======================================================

export const getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find()
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const formattedLeads = leads.map((lead) => ({
      id: lead.leadId || lead._id.toString(),

      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,

      source: lead.source,

      interestedIn: lead.interestedIn,

      budget: lead.budget,

      assignedTo:
        lead.assignedTo?._id?.toString() || null,

      assignedUser: lead.assignedTo
        ? {
            id: lead.assignedTo._id.toString(),
            name: lead.assignedTo.name,
            email: lead.assignedTo.email,
            role: lead.assignedTo.role,
          }
        : null,

      status: lead.status,

      nextFollowUp: lead.nextFollowUp,

      notes: lead.notes,

      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedLeads.length,
      data: formattedLeads,
    });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET SINGLE LEAD
// ======================================================

export const getLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    let lead = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findById(id)
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email");
    }

    if (!lead) {
      lead = await Lead.findOne({ leadId: id })
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email");
    }

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: lead.leadId || lead._id.toString(),
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        interestedIn: lead.interestedIn,
        budget: lead.budget,
        assignedTo:
          lead.assignedTo?._id?.toString() || null,
        assignedUser: lead.assignedTo
          ? {
              id: lead.assignedTo._id.toString(),
              name: lead.assignedTo.name,
              email: lead.assignedTo.email,
              role: lead.assignedTo.role,
            }
          : null,
        status: lead.status,
        nextFollowUp: lead.nextFollowUp,
        notes: lead.notes,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// UPDATE LEAD
// ======================================================

export const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      name,
      company,
      phone,
      email,
      source,
      interestedIn,
      budget,
      assignedTo,
      status,
      nextFollowUp,
      notes,
    } = req.body;

    if (
      assignedTo &&
      !mongoose.Types.ObjectId.isValid(assignedTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid assigned user",
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name?.trim();
    if (company !== undefined) updateData.company = company?.trim();
    if (phone !== undefined) updateData.phone = phone?.trim();
    if (email !== undefined) updateData.email = email?.trim().toLowerCase();
    if (source !== undefined) updateData.source = source;
    if (interestedIn !== undefined) updateData.interestedIn = interestedIn;
    if (budget !== undefined) updateData.budget = Number(budget) || 0;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (status !== undefined) updateData.status = status;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp || null;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedBy = req.user?._id || null;

    let lead = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    if (!lead) {
      lead = await Lead.findOneAndUpdate(
        { leadId: id },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    await lead.populate(
      "assignedTo",
      "name email role"
    );

    if (status !== undefined) {
      await Activity.create({
        leadId: lead._id,
        type: "System",
        content: `Lead status updated to '${status}'`,
        createdBy: req.user?._id || null,
      });
    }

    if (assignedTo !== undefined) {
      const assignedName = lead.assignedTo?.name || "Unassigned";
      await Activity.create({
        leadId: lead._id,
        type: "System",
        content: `Lead assigned to ${assignedName}`,
        createdBy: req.user?._id || null,
      });
    }

    const targetUser = lead.assignedTo?._id || lead.assignedTo || req.user?._id;
    if (targetUser) {
      if (status === "Won") {
        await createNotificationHelper({
          user: targetUser,
          title: "Deal Won! 🎉",
          message: `Congratulations! Deal with ${lead.name} (${lead.company}) marked as Won.`,
          type: "DEAL_WON",
          link: "/leads",
        });
      } else if (nextFollowUp) {
        await createNotificationHelper({
          user: targetUser,
          title: "Follow-up Scheduled",
          message: `Follow-up with ${lead.name} scheduled for ${new Date(nextFollowUp).toLocaleDateString()}.`,
          type: "FOLLOW_UP_DUE",
          link: "/follow-ups",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: {
        id: lead.leadId,
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        interestedIn: lead.interestedIn,
        budget: lead.budget,
        assignedTo:
          lead.assignedTo?._id?.toString() || null,
        status: lead.status,
        nextFollowUp: lead.nextFollowUp,
        notes: lead.notes,
        updatedAt: lead.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// DELETE LEAD
// ======================================================

export const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    let lead = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findByIdAndDelete(id);
    }

    if (!lead) {
      lead = await Lead.findOneAndDelete({
        leadId: id,
      });
    }

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


// ======================================================
// ACTIVITIES
// ======================================================

export const getLeadActivities = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let leadId = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const lead = await Lead.findOne({ leadId: id });
      if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
      leadId = lead._id;
    }

    const activities = await Activity.find({ leadId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

export const createLeadActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({ success: false, message: "Type and content are required" });
    }

    let leadId = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const lead = await Lead.findOne({ leadId: id });
      if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
      leadId = lead._id;
    }

    const activity = await Activity.create({
      leadId,
      type,
      content,
      createdBy: req.user?._id || null,
    });

    const populatedActivity = await Activity.findById(activity._id).populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: populatedActivity,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    if (activity.type === "System") {
      return res.status(403).json({ success: false, message: "System activities cannot be edited" });
    }

    activity.content = content;
    await activity.save();

    const populatedActivity = await Activity.findById(activity._id).populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: populatedActivity,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    if (activity.type === "System") {
      return res.status(403).json({ success: false, message: "System activities cannot be deleted" });
    }

    await activity.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};