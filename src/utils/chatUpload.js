const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "chat/files";
    let resource_type = "raw"; // 🔥 default

    if (file.mimetype.startsWith("image")) {
      folder = "chat/images";
      resource_type = "image";
    } 
    else if (file.mimetype.startsWith("video")) {
      folder = "chat/videos";
      resource_type = "video";
    } 
    else if (file.mimetype.startsWith("audio")) {
      folder = "chat/audio";
      resource_type = "video"; // audio = video
    }

    return {
      folder,
      resource_type, // 🔥 MOST IMPORTANT
      public_id: Date.now() + "-" + file.originalname,
    };
  },
});

module.exports = multer({ storage });
