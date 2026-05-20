const express = require("express");
const sharp = require("sharp");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();

app.use(
  cors({
    origin: "https://hasnanachiyars19.wixstudio.com",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.options(/.*/, cors());

app.use(
  express.json({
    limit: "20mb",
  }),
);

// CREATE FOLDERS IF MISSING
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("converted")) {
  fs.mkdirSync("converted");
}

// =====================
// MULTER STORAGE
// =====================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

// =====================
// CONVERT API
// =====================
app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.post("/convert-url", upload.single("image"), async (req, res) => {
  try {
    const format = req.body.format;

    if (!req.file || !format) {
      return res.status(400).json({
        error: "Missing image or format",
      });
    }

    const inputPath = req.file.path;

    const outputFilename = Date.now() + "." + format;

    const outputPath = path.join(__dirname, "converted", outputFilename);

    let image = sharp(inputPath);

    switch (format) {
      case "png":
        image = image.png();
        break;

      case "jpg":
      case "jpeg":
        image = image.jpeg({ quality: 90 });
        break;

      case "webp":
        image = image.webp({ quality: 90 });
        break;

      case "avif":
        image = image.avif();
        break;

      default:
        return res.status(400).json({
          error: "Invalid format",
        });
    }

    await image.toFile(outputPath);

    res.download(outputPath, () => {
      setTimeout(() => {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }

        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }, 3000);
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});
// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
