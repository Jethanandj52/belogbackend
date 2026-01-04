const multer = require("multer");
const path = require("path");

// Temporary storage (disk storage)
const storage = multer.diskStorage({}); 

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

module.exports = { upload };