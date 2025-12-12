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
    const pdfTypes = /pdf/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (["profileImage", "reviewImg", "paymentProof", "image", "signtory"].includes(file.fieldname)) {
      if (imageTypes.test(extname) && mimetype.startsWith("image/")) {
        return cb(null, true);
      } else {
        return cb(new Error("Only image files are allowed."));
      }
    }

    if (file.fieldname === "voiceProof") {
      if (audioTypes.test(extname) && mimetype.startsWith("audio/")) {
        return cb(null, true);
      } else {
        return cb(new Error("Only audio files are allowed for voiceProof."));
      }
    }

    if (file.fieldname === "file") {
      if (pdfTypes.test(extname) && mimetype === "application/pdf") {
        return cb(null, true);
      } else {
        return cb(new Error("Only PDF files are allowed for invoice."));
      }
    }

    // ✅ Handle Image (invoice file uploads)
    if (file.fieldname === "logo") {
      if (imageTypes.test(extname) && mimetype.startsWith("image/")) {
        return cb(null, true);
      } else {
        return cb(new Error("Only images files are allowed for invoice."));
      }
    }

    cb(new Error("Unsupported file field."));
  },
});

module.exports = upload; // ✅ Export the full upload object
