const express = require("express");
const sharp = require("sharp");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());

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

app.post("/convert", upload.single("image"), async (req, res) => {
  try {
    const format = req.body.format;

    const inputPath = req.file.path;

    const outputFilename = Date.now() + "." + format;

    const outputPath = path.join(__dirname, "converted", outputFilename);

    let image = sharp(inputPath);

    switch (format) {
      case "png":
        image = image.png();
        break;

      case "jpg":
        image = image.jpeg({
          quality: 90,
        });
        break;

      case "webp":
        image = image.webp({
          quality: 90,
        });
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

    res.download(outputPath);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Conversion failed",
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
