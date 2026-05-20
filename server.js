const express = require("express");
const sharp = require("sharp");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();

// =====================
// CORS
// =====================

app.use(
  cors({
    origin: "https://hasnanachiyars19.wixstudio.com",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.options(/.*/, cors());

// =====================
// JSON LIMIT
// =====================

app.use(
  express.json({
    limit: "20mb",
  }),
);

// =====================
// CREATE FOLDERS
// =====================

if (!fs.existsSync("converted")) {
  fs.mkdirSync("converted");
}

// =====================
// TEST ROUTE
// =====================

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// =====================
// CONVERT API
// =====================

app.post("/convert-url", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { imageUrl, format } = req.body;

    if (!imageUrl || !format) {
      return res.status(400).json({
        error: "Missing imageUrl or format",
      });
    }

    console.log("IMAGE URL:", imageUrl);
    console.log("FORMAT:", format);

    // DOWNLOAD IMAGE
    console.log("Downloading image:", imageUrl);
    const response = await axios({
      method: "GET",

      url: imageUrl,

      responseType: "arraybuffer",

      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://hasnanachiyars19.wixstudio.com",
      },
    });
    console.log("Download success");

    console.log("Image downloaded");

    // OUTPUT FILE
    const outputFilename = Date.now() + "." + format;

    const outputPath = path.join(__dirname, "converted", outputFilename);

    // SHARP
    let image = sharp(response.data);

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

    console.log("Converting image...");

    await image.toFile(outputPath);

    console.log("Conversion complete");

    // DOWNLOAD FILE
    res.download(outputPath, () => {
      setTimeout(() => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }, 3000);
    });
  } catch (err) {
    console.error("BACKEND ERROR:", err);

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
