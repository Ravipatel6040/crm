import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Campaign } from "./src/models/campaign.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

const mockCampaigns = [
  {
    name: "Summer Mega Sale 2026",
    platform: "Google Ads",
    status: "Active",
    budget: 150000,
    spend: 125000,
    leads: 850,
    qualified: 320,
    proposals: 150,
    won: 45,
    revenue: 450000,
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-08-31"),
    utm: {
      source: "google",
      medium: "cpc",
      campaign: "summer-sale-2026",
      landingUrl: "https://example.com/summer-sale"
    }
  },
  {
    name: "B2B Retargeting - Q3",
    platform: "LinkedIn",
    status: "Active",
    budget: 80000,
    spend: 60000,
    leads: 120,
    qualified: 80,
    proposals: 50,
    won: 15,
    revenue: 280000,
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-09-30"),
    utm: {
      source: "linkedin",
      medium: "cpm",
      campaign: "b2b-retargeting",
      landingUrl: "https://example.com/b2b-offer"
    }
  },
  {
    name: "Festive Season Instagram Reels",
    platform: "Instagram",
    status: "Active",
    budget: 50000,
    spend: 50000,
    leads: 1200,
    qualified: 400,
    proposals: 120,
    won: 30,
    revenue: 180000,
    startDate: new Date("2026-08-01"),
    endDate: new Date("2026-08-30"),
    utm: {
      source: "instagram",
      medium: "social",
      campaign: "festive-reels",
      landingUrl: "https://example.com/festive"
    }
  },
  {
    name: "Cold Email Outreach (Founders)",
    platform: "Website",
    status: "Paused",
    budget: 5000,
    spend: 2500,
    leads: 45,
    qualified: 15,
    proposals: 10,
    won: 2,
    revenue: 50000,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    utm: {
      source: "newsletter",
      medium: "email",
      campaign: "founder-outreach",
      landingUrl: "https://example.com/founders"
    }
  },
  {
    name: "Partner Affiliate Network",
    platform: "Referral",
    status: "Active",
    budget: 200000,
    spend: 45000,
    leads: 200,
    qualified: 150,
    proposals: 90,
    won: 40,
    revenue: 600000,
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-12-31"),
    utm: {
      source: "partner",
      medium: "affiliate",
      campaign: "partner-network",
      landingUrl: "https://example.com/partners"
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");
    
    // Optional: Clear existing campaigns before seeding to avoid duplicates
    await Campaign.deleteMany({});
    console.log("Cleared existing campaigns.");

    await Campaign.insertMany(mockCampaigns);
    console.log("Successfully inserted mock campaigns.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding campaigns:", error);
    process.exit(1);
  }
}

seed();
