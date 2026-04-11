// utils/cloudinaryUpload.js
const path = require("path");
const cloudinary = require("../config/cloudinaryConfig");

// Simple slug to make public_id safe
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

const detectResourceType = (mimetype, originalname, fallback = "raw") => {
  const ext = (originalname || "").toLowerCase();
  if (mimetype?.startsWith("image/")) return "image";
  if (mimetype?.startsWith("video/")) return "video";
  if (mimetype?.startsWith("audio/")) return "video"; // Cloudinary groups audio under video
  if (mimetype === "application/pdf") return "raw";
  // Many browsers send PDFs as octet-stream; fall back to extension
  if (ext.endsWith(".pdf")) return "raw";
  return fallback; // safer than 'auto' when you expect non-images
};


const uploadBuffer = (file, opts = {}) =>
  new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resourceType,
      keepFilename = true,
      forcePdfExtension = true,
      publicId,
      format
    } = opts;

    const type = resourceType || detectResourceType(file.mimetype, file.originalname);

    // Build a nice public_id so URLs include extension when desired
    let pid = publicId;
    if (!pid && keepFilename) {
      const { name, ext } = path.parse(file.originalname || "file");
      let base = slugify(name || "file");
      // Make sure we don't end up with empty names
      if (!base) base = String(Date.now());
      // For raw PDFs, keep the .pdf extension in the public_id (helps with "correct format" URLs)
      if (forcePdfExtension && (ext.toLowerCase() === ".pdf" || type === "raw")) {
        if (!/\.pdf$/i.test(base)) base = `${base}.pdf`;
      }
      pid = `${folder}/${base}`;
    } else if (!pid) {
      // fallback if keepFilename is false and no publicId provided
      pid = `${folder}/${Date.now()}`;
    }

    const uploadOpts = {
      resource_type: type,
      public_id: pid,
      folder: undefined, // folder already embedded in public_id
    };

    // Optional explicit format; for raw PDFs this is not required,
    // but setting it doesn't hurt if you want consistency.
    if (format) uploadOpts.format = format;

    const stream = cloudinary.uploader.upload_stream(uploadOpts, (err, result) => {
      if (err) return reject(err);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        bytes: result.bytes,
        format: result.format
      });
    });

    stream.end(file.buffer);
  });

const uploadMany = async (files = [], opts = {}) => {
  const out = [];
  for (const f of files) out.push(await uploadBuffer(f, opts));
  return out;
};

module.exports = { uploadBuffer, uploadMany, detectResourceType };
