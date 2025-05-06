// const multer = require("multer");

// const storage = multer.memoryStorage(); // Store file in memory
// const upload = multer({ storage });

// module.exports = upload;
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png/;
    const audioTypes = /mp3|wav|mpeg/;
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (file.fieldname === "paymentProof") {
      if (imageTypes.test(extname) && mimetype.startsWith("image/")) {
        return cb(null, true);
      } else {
        return cb(new Error("Only image files are allowed for paymentProof."));
      }
    }

    if (file.fieldname === "voiceProof") {
      if (audioTypes.test(extname) && mimetype.startsWith("audio/")) {
        return cb(null, true);
      } else {
        return cb(new Error("Only audio files are allowed for voiceProof."));
      }
    }

    cb(new Error("Unsupported file field."));
  },
});

module.exports = upload; // ✅ Export the full upload object
