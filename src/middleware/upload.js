// middleware/upload.js
const multer = require("multer");

const storage = multer.diskStorage({}); // temp memory
const upload = multer({ storage });

module.exports = upload;
