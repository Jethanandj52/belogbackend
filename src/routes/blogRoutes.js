// routes/blogRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/Auth");
const upload = require("../middleware/upload");

const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,toggleLike,addComment,addReply
} = require("../controllers/blogController");

// 📸 image fields
const blogUpload = upload.fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "images", maxCount: 10 }
]);

router.post("/", verifyToken, blogUpload, createBlog);
router.get("/", getAllBlogs);
router.get("/:slug", getBlogBySlug);
router.put("/:id/like", verifyToken, toggleLike);

// 💬 Add Comment
router.post("/:id/comment", verifyToken, addComment);
router.post("/:blogId/comment/:commentId/reply", verifyToken, addReply);
router.put("/:id", verifyToken, blogUpload, updateBlog);
router.delete("/:id", verifyToken, deleteBlog);


module.exports = router;
