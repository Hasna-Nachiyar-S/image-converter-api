const express = require("express");
const sharp = require("sharp");
const cors = require("cors");
const multer = require("multer");
const PDFDocument = require("pdfkit");

const app = express();

// =====================
// CORS
// =====================

app.use(
  cors({
    origin: "*",
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

      // =====================
      // VALIDATE FILE
      // =====================

      if (!req.file) {

        return res.status(400).json({
          error: "No image uploaded",
        });
      }

      console.log("FILE OBJECT:", req.file);

      console.log(
        "BUFFER LENGTH:",
        req.file.buffer.length
      );

      console.log(
        "MIME TYPE:",
        req.file.mimetype
      );

      console.log(
        "FORMAT:",
        req.body.format
      );

      // =====================
      // VALIDATE IMAGE
      // =====================

      let image;

      try {

        image = sharp(req.file.buffer);

        await image.metadata();

      } catch (err) {

        console.error(
          "SHARP ERROR:",
          err
        );

        return res.status(400).json({
          error:
            "Unsupported or corrupted image",
        });
      }

      // =====================
      // FORMAT
      // =====================

      const format =
        req.body.format
          ?.toLowerCase();

      // =====================
      // PDF CONVERSION
      // =====================

      if (format === "pdf") {

        // Convert image to PNG buffer
        // for better PDF compatibility

        const pngBuffer =
          await image
            .png()
            .toBuffer();

        // Create PDF

        const doc =
          new PDFDocument({
            autoFirstPage: false,
          });

        const buffers = [];

        doc.on(
          "data",
          buffers.push.bind(buffers)
        );

        doc.on(
          "end",
          () => {

            const pdfBuffer =
              Buffer.concat(buffers);

            res.set({

              "Content-Type":
                "application/pdf",

              "Content-Disposition":
                "attachment; filename=converted.pdf",

            });

            res.send(pdfBuffer);
          }
        );

        // Add page

        doc.addPage({
          size: "A4",
          margin: 20,
        });

        // Add image to PDF

        doc.image(
          pngBuffer,
          {
            fit: [555, 800],
            align: "center",
            valign: "center",
          }
        );

        // Finalize PDF

        doc.end();

        return;
      }

      // =====================
      // IMAGE CONVERSIONS
      // =====================

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

      // =====================
      // GENERATE BUFFER
      // =====================

      const outputBuffer =
        await image.toBuffer();

      // =====================
      // MIME TYPE
      // =====================

      let contentType =
        `image/${format}`;

      if (
        format === "jpg" ||
        format === "jpeg"
      ) {

        contentType =
          "image/jpeg";
      }

      // =====================
      // SEND FILE
      // =====================

      res.set({

        "Content-Type":
          contentType,

        "Content-Disposition":
          `attachment; filename=converted.${format}`,

      });

      res.send(outputBuffer);

    } catch (err) {

      console.error(
        "BACKEND ERROR:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  },
);

// =====================
// SERVER
// =====================

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on ${PORT}`
  );
});
