const { User } = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // 1️⃣ Cookie token
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2️⃣ Authorization header fallback
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "");
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findOne({ email: decoded.email }).select("email username");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};


exports.signToken = async (req, res, next) => {
  try {
    const userData = await User.findOne({
      $or: [{ username: req.body.username || "" }, { email: req.body.email || "" }]
    });

    if (!userData) return res.status(404).json({ success: false, message: "User not found" });

    const token = jwt.sign(
      { id: userData._id, username: userData.username, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: 30 * 24 * 60 * 60 } // 30 days
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    req.token = token;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};