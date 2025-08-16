import { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer, { StorageEngine } from "multer";
import path from "path";
import config from "../DefaultConfig/config";
const mimetype = [
  "image/jpeg",
  "video/mp4",
  "image/webp",
  "image/png",
  "application/pdf",
];
export const UnlinkFiles = (files: string[]) => {
  files.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
      }
    });
  });
};

const ensureDirectoryExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const setFilePermissions = (filePath: string) => {
  try {
    fs.chmodSync(filePath, 0o777);
  } catch (err) {
    console.error(`Error setting permissions for file: ${filePath}`, err);
  }
};

const upload_product_image = () => {
  setFilePermissions(path.join("uploads"));

  const storage: StorageEngine = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        const uploadPath = path.join("uploads", file.fieldname);

        ensureDirectoryExists(uploadPath);

        if (mimetype.includes(file.mimetype)) {
          cb(null, uploadPath);
        } else {
          cb(new Error("Invalid file type"), "");
        }
      } catch (error) {
        cb(error as Error, "");
      }
    },

    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;

      const filePath = path.join("uploads", file.fieldname, name);

      ensureDirectoryExists(path.dirname(filePath));

      // setFilePermissions(path.join('uploads'));
      cb(null, name);
    },
  });

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const allowedFilenames = "variants_";

    if (file.fieldname?.startsWith(allowedFilenames)) {
      if (mimetype.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
      }
    } else {
      cb(
        new Error(
          config?.NODE_ENV === "development"
            ? `use "(variants_red / variants_blue)" this convention to upload image`
            : "Invalid field name",
        ),
      );
    }
  };

  const maxVideoLength = 5000;

  const upload = multer({
    limits: { fileSize: 5000 * 1024 * 1024 },
    storage: storage,
    fileFilter: fileFilter,
  }).any();

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).send({ success: false, message: err.message });
      }

      // Type assertion to handle the 'video' field properly
      const files = req.files as { [key: string]: Express.Multer.File[] }; //  { [fieldname: string]: Express.Multer.File[] };

      // Video size validation (if necessary)
      if (files?.video) {
        const videoFiles = files.video;
        const fileSizeMB = videoFiles[0].size / (1024 * 1024);
        if (fileSizeMB > maxVideoLength) {
          UnlinkFiles([videoFiles[0].path]);
          return res
            .status(400)
            .send({ success: false, message: "Max video length is 20 MB" });
        }
      }

      next();
    });
  };
};

export default upload_product_image;
