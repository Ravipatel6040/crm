import { Client } from "../models/client.model.js";

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
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      clients,
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

    const client = await Client.findById(id).populate("accountManager", "name email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      client,
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

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
