const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const UserRole = require("../models/UserRole");
const cloudinary = require("../config/cloudinaryConfig");

// ---------- helpers ----------
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const getIncomingFile = (req) => {
  if (req.file?.buffer) return req.file; // from upload.single or your normalizer
  if (req.files?.face?.[0]?.buffer) return req.files.face[0]; // from upload.fields
  if (req.files?.faceImage?.[0]?.buffer) return req.files.faceImage[0];
  return null;
};

const uploadToCloudinary = (file, folder, resourceType) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: resourceType }, (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      })
      .end(file.buffer);
  });

const serializeUser = (u) => ({
  id: u._id,
  username: u.username,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  age: u.age,
  phoneNumber: u.phoneNumber,
  difficultyLevel: u.difficultyLevel,
  role: u.role, 
  suitabilityForCoding: u.suitabilityForCoding,
  suitableMethod: u.suitableMethod,
  entranceTest: u.entranceTest,
  status: u.status,
  faceImgUrl: u.faceImgUrl || null
});

// ============ REGISTER ============
exports.registerUser = async (req, res) => {
  try {
    // DEBUG: see what arrived
    console.log("content-type:", req.headers["content-type"]);
    console.log("has req.file?", !!req.file, "keys in req.files:", req.files ? Object.keys(req.files) : null);

    const {
      username, email, password, firstName, lastName, age, phoneNumber,
      difficultyLevel, suitabilityForCoding, suitableMethod, entranceTest, status,
      faceBase64 // optional: allow base64 image too
    } = req.body;

    if (!username || !email || !password || !firstName || !lastName || !age || !phoneNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const emailNorm = email.trim().toLowerCase();
    const exists = await User.findOne({ $or: [{ username }, { email: emailNorm }] });
    if (exists) return res.status(400).json({ message: "Username or Email already exists" });

    const userRole = await UserRole.findOne({ name: "User" });
    if (!userRole) return res.status(500).json({ message: "Role 'User' not found. Please seed roles." });

    // ---- image handling: file OR base64 ----
    let faceImgUrl = null;
    const incomingFile = getIncomingFile(req);

    try {
      if (incomingFile) {
        faceImgUrl = await uploadToCloudinary(incomingFile, "images", "image");
      } else if (faceBase64) {
        // Accept `data:image/...;base64,....` or raw base64
        const dataUri = faceBase64.startsWith("data:")
          ? faceBase64
          : `data:image/jpeg;base64,${faceBase64}`;
        const uploaded = await cloudinary.uploader.upload(dataUri, { folder: "images", resource_type: "image" });
        faceImgUrl = uploaded.secure_url;
      }
    } catch (e) {
      console.error("Cloudinary upload error:", e?.message);
      // Optional: return 400 if face is required
      // return res.status(400).json({ message: "Face image upload failed" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: username.trim(),
      email: emailNorm,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: Number(age),
      phoneNumber: phoneNumber.trim(),
      difficultyLevel,
      suitabilityForCoding: suitabilityForCoding ?? 0,
      suitableMethod: suitableMethod ?? undefined,
      entranceTest: entranceTest ?? 0,
      role: userRole._id,
      status: status ?? 1,
      faceImgUrl
    });

    console.log("saved faceImgUrl:", newUser.faceImgUrl); 

    return res.status(201).json({
      message: "User registered successfully!",
      token: generateToken(newUser._id),
      user: serializeUser(newUser)
    });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

// ============ PASSWORD/EMAIL LOGIN ============
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNorm = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: emailNorm });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    return res.json({
      token: generateToken(user._id),
      user: serializeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Login error", error: error.message });
  }
};

// ============ FACE LOGIN ============
exports.faceLoginUser = async (req, res) => {
  try {
    const { email, capturedImage } = req.body;
    if (!email || !capturedImage) {
      return res.status(400).json({ message: "Email and captured image are required" });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user || !user.faceImgUrl) {
      return res.status(404).json({ message: "User not found or face image missing" });
    }
    if (user.status !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const FACE_COMPARE_URL = process.env.FACE_COMPARE_URL || "http://localhost:5000/compare-faces";
    const response = await axios.post(FACE_COMPARE_URL, {
      captured_image: capturedImage,
      stored_image_url: user.faceImgUrl
    });

    const ok = response?.data?.success ?? response?.data?.match ?? false;
    if (!ok) return res.status(401).json({ message: "Face authentication failed" });

    return res.json({
      token: generateToken(user._id),
      user: serializeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Face login error", error: error.message });
  }
};
