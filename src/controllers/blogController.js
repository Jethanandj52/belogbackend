// controllers/blogController.js
const { Blog } = require("../models/Blog");
const slugify = require("../utils/slugify");
const cloudinary = require("../utils/cloudinary");

/* ================= CREATE BLOG ================= */
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      categoryId,
      metaTitle,
      metaDescription,
      tags,
      status
    } = req.body;

    const slug = slugify(title);

    let featuredImage = null;
    let images = [];

    // 📸 Featured image
    if (req.files?.featuredImage) {
      const result = await cloudinary.uploader.upload(
        req.files.featuredImage[0].path,
        { folder: "blogs/featured" }
      );
      featuredImage = result.secure_url;
    }

    // 📸 Multiple images
    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "blogs/images"
        });
        images.push(result.secure_url);
      }
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      categoryId,
      featuredImage,
      images,
      metaTitle,
      metaDescription,
      tags,
      status,
      authorId: req.user._id
    });

    res.status(201).json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL BLOGS ================= */
 
/* ================= GET ALL BLOGS (With Category Filter) ================= */
exports.getAllBlogs = async (req, res) => {
  try {
    const { category } = req.query; // Frontend se ?category=Tech aayega
    let query = {};

    // Agar URL mein category aayi hai aur wo "All" nahi hai
    if (category && category !== "All") {
      // Hum categories table ko populate karke check karenge
      // Pehle category find karte hain uske naam se
      const { Category } = require("../models/Category"); // Category model import karein
      const foundCategory = await Category.findOne({ name: category });
      
      if (foundCategory) {
        query.categoryId = foundCategory._id;
      }
    }

    const blogs = await Blog.find(query)
      .populate("categoryId")
      .populate("authorId")
      .sort({ createdAt: -1 });

    res.json({ success: true, blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/* ================= GET BLOG BY SLUG + VIEW COUNT ================= */
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } }, // 👀 increment views
      { new: true }
    )
      .populate("categoryId")
      .populate("authorId");

    if (!blog)
      return res.status(404).json({ success: false, message: "Blog not found" });

    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE BLOG ================= */
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.title) data.slug = slugify(data.title);

    // 📸 update images if provided
    if (req.files?.featuredImage) {
      const result = await cloudinary.uploader.upload(
        req.files.featuredImage[0].path,
        { folder: "blogs/featured" }
      );
      data.featuredImage = result.secure_url;
    }

    if (req.files?.images) {
      data.images = [];
      for (const file of req.files.images) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "blogs/images"
        });
        data.images.push(result.secure_url);
      }
    }

    const blog = await Blog.findByIdAndUpdate(id, data, { new: true });
    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE BLOG ================= */
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await Blog.findByIdAndDelete(id);
    res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ... baaki imports waise hi rahenge

/* ================= LIKE / UNLIKE BLOG (Toggle) ================= */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    // Check if user already liked the post
    const isLiked = blog.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike: Array se user ID nikaal do
      blog.likes = blog.likes.filter((userId) => userId.toString() !== req.user._id.toString());
    } else {
      // Like: Array mein user ID daal do
      blog.likes.push(req.user._id);
    }

    await blog.save();
    res.json({ success: true, likesCount: blog.likes.length, isLiked: !isLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= ADD COMMENT ================= */
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ success: false, message: "Comment text is required" });

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    const newComment = {
      user: req.user._id,
      text
    };

    blog.comments.unshift(newComment); // Naya comment sabse upar dikhane ke liye
    await blog.save();

    // Comment add hone ke baad user info ke saath populate karke bhejna
    const updatedBlog = await Blog.findById(id).populate("comments.user", "username profilePic");

    res.json({ success: true, comments: updatedBlog.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET BLOG BY SLUG mein populate ko update karein taaki comments ke user bhi dikhein
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    )
    .populate("categoryId")
    .populate("authorId", "username profilePic")
    .populate("comments.user", "username profilePic"); // 💬 Comments ke users bhi populate karein

    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= ADD REPLY TO A COMMENT ================= */
exports.addReply = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ success: false, message: "Reply text is required" });

    // Blog dhoondo aur uske specific comment ko update karo
    const blog = await Blog.findOneAndUpdate(
      { _id: blogId, "comments._id": commentId },
      {
        $push: {
          "comments.$.replies": {
            user: req.user._id,
            text: text
          }
        }
      },
      { new: true }
    ).populate("comments.user comments.replies.user", "username profilePic");

    if (!blog) return res.status(404).json({ success: false, message: "Blog or Comment not found" });

    res.json({ success: true, comments: blog.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATED GET BLOG BY SLUG ================= */
// Isme humein replies ke users ko bhi populate karna hoga
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true })
      .populate("categoryId")
      .populate("authorId", "username profilePic")
      .populate({
        path: "comments",
        populate: [
          { path: "user", select: "username profilePic" },
          { path: "replies.user", select: "username profilePic" } // Deep populate for replies
        ]
      });

    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};