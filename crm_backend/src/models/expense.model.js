import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    // Valid values come from Settings.options.expenseCategories, enforced in
    // finance.controller.js — not a schema enum (see settings.model.js).
    category: {
      type: String,
      trim: true,
      default: "Other",
    },
    // Which department bears the cost. Valid values come from
    // Settings.options.expenseDepartments, enforced in finance.controller.js.
    // Expenses recorded before departments existed have none ("") and show up
    // as "Unassigned" until someone edits them.
    department: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Expense = mongoose.model("Expense", expenseSchema);
