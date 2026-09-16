import fs from "fs";
import path from "path";
import { Client } from "../models/client.model.js";
import { Project } from "../models/project.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Payment } from "../models/payment.model.js";
import { Document } from "../models/document.model.js";
import { Communication } from "../models/communication.model.js";

// Attaches the derived, cross-collection figures the client list/detail
// views show (project count, contract value, paid/pending, last activity) —
// none of these live on Client itself, since they're really facts about its
// Projects/Invoices/Payments.
const attachClientStats = async (clients) => {
  const isSingle = !Array.isArray(clients);
  const list = isSingle ? [clients] : clients;
  const ids = list.map((c) => c._id);

  const [projects, invoices, payments] = await Promise.all([
    Project.find({ client: { $in: ids } }).select("client status createdAt").lean(),
    Invoice.find({ client: { $in: ids } }).select("client total createdAt").lean(),
    Payment.find({ client: { $in: ids } }).select("client amount status createdAt").lean(),
  ]);

  const byClient = new Map(ids.map((id) => [id.toString(), {
    projects: 0, contractValue: 0, paid: 0, pending: 0, lastActivity: null,
  }]));

  const bump = (clientId, date) => {
    const key = clientId?.toString();
    const entry = byClient.get(key);
    if (!entry) return entry;
    if (date && (!entry.lastActivity || date > entry.lastActivity)) entry.lastActivity = date;
    return entry;
  };

  projects.forEach((p) => {
    const entry = bump(p.client, p.createdAt);
    if (entry) entry.projects += 1;
  });

  invoices.forEach((inv) => {
    const entry = bump(inv.client, inv.createdAt);
    if (entry) entry.contractValue += inv.total || 0;
  });

  payments.forEach((p) => {
    const entry = bump(p.client, p.createdAt);
    if (!entry) return;
    if (p.status === "Paid") entry.paid += p.amount || 0;
    else entry.pending += p.amount || 0;
  });

  const withStats = list.map((c) => {
    const stats = byClient.get(c._id.toString());
    return {
      ...c,
      id: c._id.toString(),
      accountManager: c.accountManager?._id?.toString() || null,
      accountManagerName: c.accountManager?.name || null,
      projects: stats.projects,
      contractValue: stats.contractValue,
      paid: stats.paid,
      pending: stats.pending,
      lastActivity: stats.lastActivity || c.updatedAt,
    };
  });

  return isSingle ? withStats[0] : withStats;
};

// ======================================================
// CREATE CLIENT
// ======================================================
export const createClient = async (req, res, next) => {
  try {
    const { name, company, email, phone, status, isHighValue, accountManager, notes } = req.body;

    const newClient = await Client.create({
      name,
      company,
      email,
      phone,
      status,
      isHighValue,
      accountManager: accountManager || req.user?._id || null, // Default to logged in user if not provided
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client: newClient,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET ALL CLIENTS
// ======================================================
export const getClients = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const clients = await Client.find(filter)
      .populate("accountManager", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const withStats = await attachClientStats(clients);

    res.status(200).json({
      success: true,
      count: withStats.length,
      clients: withStats,
      data: withStats,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET SINGLE CLIENT
// ======================================================
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id).populate("accountManager", "name email").lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const withStats = await attachClientStats(client);

    res.status(200).json({
      success: true,
      client: withStats,
      data: withStats,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// UPDATE CLIENT
// ======================================================
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedClient = await Client.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("accountManager", "name email");

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// DELETE CLIENT
// ======================================================
// Projects, invoices and payments are financial/delivery history — they are
// kept and simply unlinked (client set to null; each already carries its own
// clientName/company snapshot for display). Documents and communications
// have no meaning without the client they're filed under, so those are
// deleted outright, including their files on disk.
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    await Promise.all([
      Project.updateMany({ client: id }, { $set: { client: null } }),
      Invoice.updateMany({ client: id }, { $set: { client: null } }),
      Payment.updateMany({ client: id }, { $set: { client: null } }),
      Communication.deleteMany({ client: id }),
    ]);

    const orphanedDocs = await Document.find({ client: id });
    await Document.deleteMany({ client: id });
    orphanedDocs.forEach((d) => {
      fs.unlink(path.join(process.cwd(), "public", d.url), () => {});
    });

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
