
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = "land-properties"; // Default folder for land properties

    // Set folder based on file type (image or document)
    if (file.mimetype.startsWith("image/")) {
      folder += "/images"; // Image-specific folder
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "text/plain"
    ) {
      folder += "/documents"; // Document-specific folder
    } else {
      // Reject file type if it's neither an image nor an allowed document
      throw new Error("Invalid file type, only images and documents are allowed.");
    }

    // Clean the file name to remove extra extensions (e.g., ".pdf.pdf")
    const cleanName = file.originalname.split('.').slice(0, -1).join('.');

    return {
      folder: folder,
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "docx", "txt"], // Allowed formats for both images and documents
      public_id: cleanName, // Set the cleaned file name as public_id
      access_mode: 'public', // Make the file publicly accessible
      resource_type: file.mimetype.startsWith("image/") ? 'image' : 'auto',  // Use 'auto' for non-image types like PDF
    };
  },
});

const upload = multer({ storage });

module.exports = upload;


// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary");

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: (req, file) => {
//     let folder = "land-properties";

//     if (file.mimetype.startsWith("image/")) {
//       folder += "/images";
//     } else if (
//       file.mimetype === "application/pdf" ||
//       file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//       file.mimetype === "text/plain"
//     ) {
//       folder += "/documents";
//     } else {
//       throw new Error("Invalid file type, only images and documents are allowed.");
//     }

//     const cleanName = file.originalname.split('.').slice(0, -1).join('.');

//     return {
//       folder,
//       allowed_formats: ["jpg", "jpeg", "png", "pdf", "docx", "txt"],
//       public_id: cleanName,
//       access_mode: 'public',
//       resource_type: file.mimetype.startsWith("image/") ? 'image' : 'auto',
//     };
//   },
// });

// const upload = multer({ storage });
// module.exports = upload;




