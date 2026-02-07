// import { NextFunction, Request, Response } from "express";
// import fs from "fs";
// import multer, { StorageEngine } from "multer";
// import path from "path";
// const mimetype = [
//   "image/jpeg",
//   "image/jpg",
//   "video/mp4",
//   "image/webp",
//   "image/png",
//   "application/pdf",
// ];

// const UPLOAD_ROOT =
//   process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");

// export const UnlinkFiles = (files: string[]) => {
//   files.forEach((filePath) => {
//     fs.unlink(filePath, (err) => {
//       if (err) {
//         console.error(`Error deleting file: ${filePath}`, err);
//       }
//     });
//   });
// };

// const ensureDirectoryExists = (directory: string) => {
//   if (!fs.existsSync(directory)) {
//     fs.mkdirSync(directory, { recursive: true });
//   }
// };

// const setFilePermissions = (filePath: string) => {
//   try {
//     fs.chmodSync(filePath, 0o777);
//   } catch (err) {
//     console.error(`Error setting permissions for file: ${filePath}`, err);
//   }
// };

// const uploadFile = () => {
//   setFilePermissions(path.join("uploads"));
//   const storage: StorageEngine = multer.diskStorage({
//     destination: function (req, file, cb) {
//       try {
//         const uploadPath = path.join("uploads", file.fieldname);
//         ensureDirectoryExists(uploadPath);
//         if (mimetype.includes(file.mimetype)) {
//           cb(null, uploadPath);
//         } else {
//           cb(new Error("Invalid file type"), "");
//         }
//       } catch (error) {
//         cb(error as Error, "");
//       }
//     },
//     filename: function (req, file, cb) {
//       const name = Date.now() + "-" + file.originalname;
//       const filePath = path.join("uploads", file.fieldname, name);
//       ensureDirectoryExists(path.dirname(filePath));
//       // setFilePermissions(path.join('uploads'));
//       cb(null, name);
//     },
//   });

//   const fileFilter = (
//     req: Request,
//     file: Express.Multer.File,
//     cb: multer.FileFilterCallback,
//   ) => {
//     const allowedFilenames = [
//       "img",
//       "video",
//       "logo",
//       "documents",
//       "business_documents",
//     ];
//     if (allowedFilenames.includes(file.fieldname)) {
//       if (mimetype.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         cb(new Error("Invalid file type"));
//       }
//     } else {
//       cb(new Error("Invalid field name"));
//     }
//   };

//   const maxVideoLength = 5000;

//   const upload = multer({
//     limits: { fileSize: 5000 * 1024 * 1024 }, // 5000 MB
//     storage: storage,
//     fileFilter: fileFilter,
//   }).fields([
//     { name: "img", maxCount: 4 },
//     { name: "video", maxCount: 1 },
//     { name: "logo", maxCount: 1 },
//     { name: "documents", maxCount: 2 },
//     { name: "business_documents", maxCount: 3 },
//   ]);

//   return (req: Request, res: Response, next: NextFunction) => {
//     upload(req, res, async function (err) {
//       if (err) {
//         return res.status(400).send({ success: false, message: err.message });
//       }

//       // Type assertion to handle the 'video' field properly
//       const files = req.files as { [key: string]: Express.Multer.File[] }; //  { [fieldname: string]: Express.Multer.File[] };

//       // Video size validation (if necessary)
//       if (files?.video) {
//         const videoFiles = files.video;
//         const fileSizeMB = videoFiles[0].size / (1024 * 1024);
//         if (fileSizeMB > maxVideoLength) {
//           UnlinkFiles([videoFiles[0].path]);
//           return res
//             .status(400)
//             .send({ success: false, message: "Max video length is 20 MB" });
//         }
//       }

//       next();
//     });
//   };
// };

// export default uploadFile;

// import { NextFunction, Request, Response } from "express";
// import fs from "fs";
// import multer, { StorageEngine } from "multer";
// import path from "path";

// /**
//  * ============================
//  * ✅ CHANGE 1: Upload root path
//  * ============================
//  * - Local  → ./uploads
//  * - Prod   → /mnt/uploads (via env)
//  */
// const UPLOAD_ROOT =
//   process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");

// /**
//  * Allowed mimetypes
//  */
// const mimetype = [
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/webp",
//   "video/mp4",
//   "application/pdf",
// ];

// /**
//  * ============================
//  * ✅ CHANGE 2: Safe directory creator
//  * ============================
//  */
// const ensureDirectoryExists = (directory: string) => {
//   if (!fs.existsSync(directory)) {
//     fs.mkdirSync(directory, { recursive: true });

//     // Linux permission fix (EC2)
//     if (process.platform !== "win32") {
//       fs.chmodSync(directory, 0o755);
//     }
//   }
// };

// /**
//  * Delete files helper
//  */
// export const UnlinkFiles = (files: string[]) => {
//   files.forEach((filePath) => {
//     fs.unlink(filePath, (err) => {
//       if (err) {
//         console.error(`Error deleting file: ${filePath}`, err);
//       }
//     });
//   });
// };

// /**
//  * ============================
//  * ✅ MAIN UPLOAD MIDDLEWARE
//  * ============================
//  */
// const uploadFile = () => {
//   // ✅ CHANGE 3: Ensure root folder exists ONCE
//   ensureDirectoryExists(UPLOAD_ROOT);

//   const storage: StorageEngine = multer.diskStorage({
//     destination: (req, file, cb) => {
//       try {
//         if (!mimetype.includes(file.mimetype)) {
//           return cb(new Error("Invalid file type"), "");
//         }

//         // uploads/img , uploads/video, etc
//         const uploadPath = path.join(UPLOAD_ROOT, file.fieldname);
//         ensureDirectoryExists(uploadPath);

//         cb(null, uploadPath);
//       } catch (error) {
//         cb(error as Error, "");
//       }
//     },

//     filename: (req, file, cb) => {
//       const name = `${Date.now()}-${file.originalname}`;
//       cb(null, name);
//     },
//   });

//   const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
//     const allowedFields = [
//       "img",
//       "video",
//       "logo",
//       "documents",
//       "business_documents",
//     ];

//     if (!allowedFields.includes(file.fieldname)) {
//       return cb(new Error("Invalid field name"));
//     }

//     if (!mimetype.includes(file.mimetype)) {
//       return cb(new Error("Invalid file type"));
//     }

//     cb(null, true);
//   };

//   const upload = multer({
//     limits: { fileSize: 5000 * 1024 * 1024 }, // 5GB
//     storage,
//     fileFilter,
//   }).fields([
//     { name: "img", maxCount: 4 },
//     { name: "video", maxCount: 1 },
//     { name: "logo", maxCount: 1 },
//     { name: "documents", maxCount: 2 },
//     { name: "business_documents", maxCount: 3 },
//   ]);

//   return (req: Request, res: Response, next: NextFunction) => {
//     upload(req, res, (err) => {
//       if (err) {
//         return res.status(400).json({
//           success: false,
//           message: err.message,
//         });
//       }

//       const files = req.files as
//         | { [key: string]: Express.Multer.File[] }
//         | undefined;

//       if (files?.video) {
//         const video = files.video[0];
//         const sizeMB = video.size / (1024 * 1024);

//         if (sizeMB > 5000) {
//           UnlinkFiles([video.path]);
//           return res.status(400).json({
//             success: false,
//             message: "Max video size exceeded",
//           });
//         }
//       }

//       next();
//     });
//   };
// };

// export default uploadFile;

import { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer, { StorageEngine } from "multer";
import path from "path";

const UPLOAD_ROOT =
  process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");

const mimetype = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
];

const ensureDirectoryExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    if (process.platform !== "win32") {
      fs.chmodSync(directory, 0o755);
    }
  }
};

export const UnlinkFiles = (files: string[]) => {
  files.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
      }
    });
  });
};

const uploadFile = () => {
  ensureDirectoryExists(UPLOAD_ROOT);

  const storage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(UPLOAD_ROOT, file.fieldname);
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const name = `${Date.now()}-${file.originalname}`;
      cb(null, name);
    },
  });

  const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
    const allowedFields = [
      "img",
      "video",
      "logo",
      "documents",
      "business_documents",
    ];

    if (!allowedFields.includes(file.fieldname)) {
      return cb(new Error("Invalid field name"));
    }

    if (!mimetype.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  };

  const upload = multer({
    limits: { fileSize: 5000 * 1024 * 1024 },
    storage,
    fileFilter,
  }).fields([
    { name: "img", maxCount: 4 },
    { name: "video", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "documents", maxCount: 2 },
    { name: "business_documents", maxCount: 3 },
  ]);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const files = req.files as
        | { [key: string]: Express.Multer.File[] }
        | undefined;

      // ✅ CHANGE: Override file.path to public URL
      Object.keys(files || {}).forEach((field) => {
        files![field] = files![field].map((file) => {
          const publicPath = `/uploads/${file.fieldname}/${file.filename}`;
          return { ...file, path: publicPath }; // override path
        });
      });

      // Optional video size check
      if (files?.video) {
        const video = files.video[0];
        const sizeMB = video.size / (1024 * 1024);

        if (sizeMB > 5000) {
          UnlinkFiles([video.path]);
          return res.status(400).json({
            success: false,
            message: "Max video size exceeded",
          });
        }
      }

      next();
    });
  };
};

export default uploadFile;
