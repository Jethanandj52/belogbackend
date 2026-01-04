const express = require("express");
const { verifyToken } = require("../middleware/Auth");
const { createCategory, getAllCategories, updateCategory, deleteCategory } = require("../controllers/categoryController");

const router = express.Router();

router.post("/", createCategory);
router.get("/", getAllCategories);
router.put("/:id", updateCategory);
router.delete("/:id", verifyToken, deleteCategory);

module.exports = router;
