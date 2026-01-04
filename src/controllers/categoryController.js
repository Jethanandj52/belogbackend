const { Category } = require("../models/Category");
const slugify = require("../utils/slugify");

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const slug = slugify(name);
        const category = await Category.create({ name, slug });
        res.status(201).json({ success: true, category });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, categories });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const slug = slugify(name);
        const category = await Category.findByIdAndUpdate(id, { name, slug }, { new: true });
        res.status(200).json({ success: true, category });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Category deleted" });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
