const { GuestPost } = require("../models/GuestPost");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const { sendEmail } = require("../utils/sendEmail");
const slugify = require("../utils/slugify"); // ✅ Aapki utility file

/* ================= CREATE GUEST POST ================= */
exports.createGuestPost = async (req, res) => {
    try {
        const { name, email, articleTitle, articleContent, category, website, backlink, anchorText } = req.body;

        // 🔥 Unique Slug Generate karein: title-randomid
        const baseSlug = slugify(articleTitle);
        const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

        let featuredImage = "";
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "guest_posts/featured",
            });
            featuredImage = result.secure_url;
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        const guestPost = await GuestPost.create({
            name, email, articleTitle, articleContent, category,
            slug: uniqueSlug, // ✅ Slug database mein save
            featuredImage, website, backlink, anchorText, status: 'pending'
        });

        // 📧 1. ADMIN KO NOTIFY KAREIN
        const adminHtml = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #2563eb;">New Guest Post Alert!</h2>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Title:</strong> ${articleTitle}</p>
                <p>Please review and update the status from admin panel.</p>
                <a href="http://localhost:3000/admin" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Admin Panel</a>
            </div>
        `;
        await sendEmail("jethanandj52@gmail.com", "Action Required: New Guest Post", adminHtml);

        res.status(201).json({ success: true, message: "Post submitted! Admin notified.", guestPost });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ================= UPDATE STATUS (Approve/Reject) ================= */
exports.updateGuestPostStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        const post = await GuestPost.findByIdAndUpdate(id, { status }, { new: true });
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        // 📧 2. USER KO NOTIFY KAREIN
        const userHtml = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: ${status === 'approved' ? '#10b981' : '#ef4444'};">
                    Update: Your Post has been ${status.toUpperCase()}
                </h2>
                <p>Hi ${post.name},</p>
                <p>We have reviewed your article <strong>"${post.articleTitle}"</strong>.</p>
                ${status === 'approved' 
                    ? `<p>Congratulations! Your post is now live. <a href="http://localhost:3000/home/guest-posts/${post.slug}">View Post</a></p>` 
                    : `<p>Unfortunately, we couldn't publish your post at this time.</p>`
                }
                <p>Regards,<br/>Team Admin</p>
            </div>
        `;
        await sendEmail(post.email, `Guest Post Status: ${status}`, userHtml);

        res.json({ success: true, message: `Status updated to ${status}`, post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ================= GET SINGLE POST (Using Slug) ================= */
exports.getSingleGuestPost = async (req, res) => {
    try {
        const { slug } = req.params;
        // ID ke bajaye slug se search karenge
        const post = await GuestPost.findOne({ slug }).populate("category");
        
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });
        res.json({ success: true, post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ================= GET ALL POSTS ================= */
exports.getAllGuestPosts = async (req, res) => {
    try {
        const posts = await GuestPost.find().populate("category").sort("-createdAt");
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ================= DELETE POST ================= */
exports.deleteGuestPost = async (req, res) => {
    try {
        await GuestPost.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};