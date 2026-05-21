const express = require("express");
const sharp = require("sharp");
const cors = require("cors");
const multer = require("multer");

const app = express();

// =====================
// CORS
// =====================

app.use(
  cors({
    origin: "https://hasnanachiyars19.wixstudio.com",
  }),
);

// =====================
// MULTER MEMORY STORAGE
// =====================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =====================
// TEST ROUTE
// =====================

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// =====================
// CONVERT ROUTE
// =====================

app.post(
  "/convert-url",
  upload.single("image"),

  async (req, res) => {
    try {
      console.log("FILE:", req.file);

      console.log("BODY:", req.body);

      if (!req.file || !req.body.format) {
        return res.status(400).json({
          error: "Missing image or format",
        });
      }

      console.log("MIME:", req.file.mimetype);

      // Validate image
      let image;

      try {
        image = sharp(req.file.buffer);

        await image.metadata();
      } catch (err) {
        console.error("SHARP ERROR:", err);

        return res.status(400).json({
          error: "Unsupported or corrupted image",
        });
      }

      const format = req.body.format;

      // Convert
      switch (format) {
        case "png":
          image = image.png();

          break;

        case "jpg":
        case "jpeg":
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

      // Generate buffer
      const outputBuffer = await image.toBuffer();

      // Send file
      res.set({
        "Content-Type": `image/${format}`,

        "Content-Disposition": `attachment; filename=converted.${format}`,
      });

      res.send(outputBuffer);
    } catch (err) {
      console.error("BACKEND ERROR:", err);

      res.status(500).json({
        error: err.message,
      });
    }
  },
);

// =====================
// SERVER
// =====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
