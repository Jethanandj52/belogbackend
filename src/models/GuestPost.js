const mongoose = require('mongoose');

const guestPostSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    articleTitle: { type: String, required: true },
    articleContent: { type: String, required: true },
    // 🔥 Slug field add ki hai
    slug: { type: String, unique: true }, 
    featuredImage: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    backlink: { type: String },
    anchorText: { type: String },
    status: { type: String, enum: ['pending','approved','rejected','published'], default: 'pending' }
}, { timestamps: true });

const GuestPost = mongoose.model('GuestPost', guestPostSchema);
module.exports = { GuestPost };