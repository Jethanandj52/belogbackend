const mongoose = require("mongoose");

// Reply Schema
const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Comment Schema (with Replies)
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  replies: [replySchema], // ↩️ Nested Replies
  createdAt: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  featuredImage: { type: String },
  images: [{ type: String }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = { Blog: mongoose.model("Blog", blogSchema) };