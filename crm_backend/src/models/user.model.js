import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: function () {
        return this.role === "ADMIN" ? "Admin" : "User";
      },
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      required: true,
      enum: [
        "ADMIN",
        "BD_SALES",
        "MARKETING",
        "PROJECT_MANAGER",
        "FINANCE"
      ],
      index: true
    },

    status: {
      type: String,
      required: true,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED"
      ],
      default: "ACTIVE",
      index: true
    },

    refreshTokenHash: {
      type: String,
      default: null,
      select: false
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model(
  "User",
  userSchema
);