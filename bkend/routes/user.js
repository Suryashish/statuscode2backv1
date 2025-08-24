// server/index.js
require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const router = express.Router();

// --- Middleware ---
router.use(express.json()); // Body parser for JSON requests
router.use(
  cors()
);

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Mongoose Schema (based on your initialFormData) ---
const userProfileSchema = new mongoose.Schema(
  {
    // Basic Info
    fullName: { type: String, required: true },
    dob: { type: String, required: true }, // Storing as string "YYYY-MM-DD"
    gender: String,
    location: String,
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    }, // Optional, but unique if provided
    phone: String,

    // Physical Parameters
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bmi: String, // Calculated on frontend, stored as string
    bodyType: String,
    waistCircumference: Number,

    // Medical Info
    bloodPressure: String,
    bloodSugar: Number,
    cholesterol: Number,
    conditions: [String], // Array of strings
    otherConditions: String,
    allergiesMedications: String,
    surgeries: String,
    consent: { type: Boolean, required: true, default: false }, // Explicit consent for sensitive data

    // Lifestyle
    activityLevel: String,
    dietaryPreference: String,
    smoking: String,
    alcohol: String,
    sleep: Number,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// --- Mongoose Model ---
const UserProfile = mongoose.model("UserProfile", userProfileSchema);

// --- API Routes ---

// Route 1: Create a new user profile (POST /api/profiles)
router.post("/api/profiles", async (req, res) => {
  try {
    const newUserProfile = new UserProfile(req.body);
    await newUserProfile.save();
    res.status(201).json(newUserProfile); // Respond with the created profile
  } catch (error) {
    console.error("Error creating user profile:", error);
    if (error.code === 11000) {
      // MongoDB duplicate key error (for unique fields like email)
      return res
        .status(409)
        .json({ message: "A profile with this email already exists." });
    }
    res.status(400).json({ message: error.message }); // Send validation errors or other bad request issues
  }
});

// Route 2: Get all user profiles (GET /api/profiles) - for testing/admin purposes
router.get("/api/profiles", async (req, res) => {
  try {
    const profiles = await UserProfile.find({});
    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route 3: Get a single user profile by ID (GET /api/profiles/:id)
router.get("/api/profiles/:id", async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching single user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route 4: Update an existing user profile by ID (PUT /api/profiles/:id)
router.put("/api/profiles/:id", async (req, res) => {
  try {
    const updatedProfile = await UserProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // `new: true` returns the updated doc, `runValidators` ensures schema validation
    );
    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "A profile with this email already exists." });
    }
    res.status(400).json({ message: error.message });
  }
});

// Route 5: Delete a user profile by ID (DELETE /api/profiles/:id)
router.delete("/api/profiles/:id", async (req, res) => {
  try {
    const deletedProfile = await UserProfile.findByIdAndDelete(req.params.id);
    if (!deletedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res
      .status(200)
      .json({
        message: "Profile deleted successfully",
        profileId: req.params.id,
      });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
