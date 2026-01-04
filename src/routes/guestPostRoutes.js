const express = require("express");
const router = express.Router();
const { upload } = require("../utils/multer");

const { 
    createGuestPost, 
    getAllGuestPosts, 
    updateGuestPostStatus, 
    deleteGuestPost,
    getSingleGuestPost 
} = require("../controllers/guestPostController");

/* ======================================================
   POST ROUTES
====================================================== */

// 1. Submit Guest Post (Public)
// Frontend FormData mein key "featuredImage" honi chahiye
router.post("/", upload.single("featuredImage"), createGuestPost);

// 2. Get All Posts (Admin/Public Library)
router.get("/", getAllGuestPosts);

// 3. Update Status (Admin: Approve/Reject)
router.put("/:id/status", updateGuestPostStatus);

// 4. Delete Post (Admin)
router.delete("/:id", deleteGuestPost);

/* ======================================================
   SLUG ROUTE (Hamesha Sabse Niche)
====================================================== */

// 5. Get Single Guest Post by Slug (Public)
// Isko niche isliye rakha hai taaki Express pehle oper wale 
// specific routes (/:id/status etc.) ko check kare.
router.get("/:slug", getSingleGuestPost);


module.exports = router;