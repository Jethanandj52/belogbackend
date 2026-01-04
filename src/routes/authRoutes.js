const express = require("express");

const { 
  register, 
  login, 
  forgotPassword, 
  verifyOTP, 
  resetPassword,
  logout , 
  getUserById,
  getAllUsers,
  editUserData,
  changePassword,updateSettings,deleteAccount,updateUserRole, toggleUserStatus,adminDeleteUser
} = require("../controllers/authController");

const { signToken, verifyToken } = require("../middleware/Auth");  
const router = express.Router();

 
router.post("/register", register);

 
router.post("/login", signToken, login);

 
router.post("/logout", verifyToken, logout);   
 
router.post('/edit-user', verifyToken, editUserData);

 
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.get('/getUserById/:id', getUserById)
router.get('/getAllUsers',getAllUsers)
router.post("/change-password", verifyToken, changePassword);
// routes/auth.js
router.post("/update-settings", verifyToken, updateSettings);
router.delete("/delete-account", verifyToken, deleteAccount);
router.put("/update-role/:id", updateUserRole);
router.put("/toggle-status/:id", toggleUserStatus);
router.delete("/admin-delete-user/:id", adminDeleteUser);
// change-password route aapne pehle hi banaya hua hai

module.exports = router;
