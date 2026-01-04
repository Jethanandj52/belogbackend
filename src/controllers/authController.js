const { User } = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
 

// =============================
// REGISTER
// =============================
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashed
    });

return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: newUser._id
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

 
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "Email not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOTP = otp;
    user.resetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Get frontend link from env variable
    const frontendURL = process.env.FRONTEND || "https://task-hive-entrovex.vercel.app";

    const mailOptions = {
      from: `"Mini Blog" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
      <div style="
        font-family: 'Arial', sans-serif;
        background: #081764ff;
        min-height: 100vh;
        padding: 50px 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <div style="
          background: rgba(159, 30, 30, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 40px 30px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 8px 20px rgba(49, 0, 0, 0.3);
        ">
          <div style="margin-bottom: 20px;">
            <div style="
              width: 50px;
              height: 50px;
              background-color: #065b11ff;
              margin: auto;
              transform: rotate(45deg);
              border-radius: 10px;
            "></div>
          </div>

          <h1 style="
            font-size: 28px;
            font-weight: bold;
            color:  #065b11ff;
            margin-bottom: 10px;
          ">
            Task-Hive OTP Verification
          </h1>

          <p style="
            font-size: 16px;
            color: #e0e0e0;
            margin-bottom: 25px;
          ">
            Use the following OTP to reset your password:
          </p>

          <div style="
            font-size: 36px;
            font-weight: bold;
            background: linear-gradient(90deg,  #065b11ff,  #065b11ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p style="
            font-size: 14px;
            color: #ccc;
            margin-bottom: 25px;
          ">
            This OTP will expire in 10 minutes.
          </p>

          <a href="${frontendURL}/login" style="
            display: inline-block;
            padding: 12px 25px;
            background-color: #ffd700;
            color: #000;
            font-weight: bold;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Go to Login
          </a>

          <p style="
            font-size: 12px;
            color: #bbb;
            margin-top: 25px;
          ">
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "OTP sent to your email" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// =============================
// VERIFY OTP
// =============================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.resetOTP || !user.resetOTPExpire)
      return res.status(400).json({ success: false, message: "OTP not generated" });

    if (Date.now() > user.resetOTPExpire)
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (user.resetOTP != otp)
      return res.status(400).json({ success: false, message: "Wrong OTP" });

    user.isOTPVerified = true;
    await user.save();

    

    return res.status(200).json({ success: true, message: "OTP verified" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
 
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword)
      return res.status(400).json({ success: false, message: "All fields required" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isOTPVerified)
      return res.status(400).json({ success: false, message: "OTP not verified" });

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.resetOTP = null;
    user.resetOTPExpire = null;
    user.isOTPVerified = false;

    await user.save();

 
    return res.status(200).json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

 
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({ success: false, message: "Username/email and password are required" });
    }

    const user = await User.findOne({
      $or: [{ username: username || "" }, { email: email || "" }]
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) return res.status(401).json({ success: false, message: "Invalid Credentials" });

    // Agar user block hai toh login na karne dein
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account is deactivated. Contact Admin." });
    }

    user.isActive = true;

    // Token check (Jo aapke middleware se aa raha hai)
    const token = req.token;

    const now = new Date();
    now.setDate(now.getDate() + 30);
    user.tokens.push({ token, expiredAt: now.toISOString() });

    await user.save();

    // ✅ YAHAN ROLE ADD KIYA HAI
    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token, 
      id: user._id,
      role: user.role, // Frontend ko batane ke liye ke ye admin hai ya nahi
      username: user.username
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
 
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (token) {
      user.tokens = user.tokens.filter(t => t.token !== token);
      await user.save();
    }

    res.clearCookie("token");

    return res.status(200).json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// =============================
// GET USER BY ID
// =============================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -tokens -resetOTP -resetOTPExpire");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// =============================
// GET ALL USERS
// =============================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -tokens -resetOTP -resetOTPExpire");
    return res.status(200).json({ success: true, count: users.length, users });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// =============================
// EDIT USER DATA
// =============================
 

exports.editUserData = async (req, res) => {
  try {
    const { username, email } = req.body;

    // ✅ Update user by _id safely
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(username && { username }),
        ...(email && { email }),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Generate new JWT token if email or username updated
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// verifyToken middleware se user available hoga
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ success: false, message: "All fields required" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


// =============================
// UPDATE USER SETTINGS (Toggles)
// =============================
exports.updateSettings = async (req, res) => {
  try {
    const { settingKey, value } = req.body; // e.g., settingKey: "twoFactor", value: true

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Dynamic update based on settingKey
    user.settings[settingKey] = value;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: "Setting updated", 
      settings: user.settings 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// =============================
// DELETE ACCOUNT
// =============================
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.status(200).json({ success: true, message: "Account deleted permanently" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// =============================
// UPDATE USER ROLE (Admin/Author/Guest)
// =============================
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // role: "admin" or "author" or "guest"
    
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, message: `User is now ${role}`, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =============================
// TOGGLE STATUS (Block/Unblock)
// =============================
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isActive = !user.isActive; // Toggle boolean
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: `User ${user.isActive ? 'Activated' : 'Blocked'}` 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =============================
// DELETE USER (Admin only)
// =============================
exports.adminDeleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};