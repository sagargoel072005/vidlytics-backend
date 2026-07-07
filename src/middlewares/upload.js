const multer = require("multer");

const storage = multer.diskStorage({});

const Upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",

    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image allowed"));
    }
  },

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = Upload;