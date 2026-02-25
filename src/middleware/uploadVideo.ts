// import { Request, Response, NextFunction } from "express";
// import Busboy from "busboy";
// import fs from "fs";
// import path from "path";
// import ffmpeg from "fluent-ffmpeg";
// import ffmpegPath from "ffmpeg-static";

// ffmpeg.setFfmpegPath(ffmpegPath as string);

// const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
// const MAX_VIDEO_SIZE_MB = 5000;

// const ensureDir = (dir: string) => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// };

// const uploadVideo = () => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const busboy = Busboy({
//       headers: req.headers,
//       limits: {
//         files: 1,
//         fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024,
//       },
//     });

//     const fields: Record<string, any> = {};
//     let tempVideoPath = "";

//     busboy.on("field", (name, value) => {
//       fields[name] = value;
//     });

//     busboy.on("file", (fieldname, file, info) => {
//       const { filename, mimeType } = info;

//       if (fieldname !== "video") {
//         file.resume();
//         return;
//       }

//       if (!VIDEO_MIME_TYPES.includes(mimeType)) {
//         file.resume();
//         return res.status(400).json({
//           success: false,
//           message: "Invalid video format",
//         });
//       }

//       const tempDir = path.join("uploads", "temp");
//       ensureDir(tempDir);

//       tempVideoPath = path.join(tempDir, `${Date.now()}-${filename}`);
//       file.pipe(fs.createWriteStream(tempVideoPath));
//     });

//     busboy.on("finish", () => {
//       if (!tempVideoPath) {
//         return res.status(400).json({
//           success: false,
//           message: "Video not uploaded",
//         });
//       }

//       const videoId = Date.now().toString();
//       const hlsDir = path.join("uploads", "hls", videoId);
//       ensureDir(hlsDir);

//       const playlistPath = path.join(hlsDir, "index.m3u8");

//       ffmpeg(tempVideoPath)
//         .outputOptions([
//           "-preset veryfast",
//           "-g 48",
//           "-sc_threshold 0",
//           "-hls_time 15",
//           "-hls_list_size 0",
//           "-hls_segment_filename",
//           path.join(hlsDir, "segment_%03d.ts"),
//         ])
//         .output(playlistPath)
//         .on("end", () => {
//           fs.unlinkSync(tempVideoPath);

//           req.body = {
//             ...fields,
//             video: playlistPath,
//           };

//           next();
//         })
//         .on("error", (err) => {
//           console.error("FFmpeg error:", err);
//           return res.status(500).json({
//             success: false,
//             message: "HLS conversion failed",
//           });
//         })
//         .run();
//     });

//     req.pipe(busboy);
//   };
// };

// export default uploadVideo;

// import Busboy from "busboy";
// import crypto from "crypto";
// import { NextFunction, Request, Response } from "express";
// // import ffmpegPath from "ffmpeg-static";
// import ffmpeg from "fluent-ffmpeg";
// import fs from "fs";
// import path from "path";
// ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

// // Set ffmpeg binary path
// // ffmpeg.setFfmpegPath(ffmpegPath as string);

// // ======================
// // CONFIGURATION
// // ======================

// const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// const MAX_VIDEO_SIZE_MB = 500;
// const BASE_UPLOAD_DIR =
//   process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
// const TEMP_DIR = path.join(BASE_UPLOAD_DIR, "temp");
// const HLS_DIR = path.join(BASE_UPLOAD_DIR, "hls");

// // ======================
// // HELPERS
// // ======================

// const ensureDir = (dir: string) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// };

// const safeFilename = (filename: string) => {
//   return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, "_");
// };

// // ======================
// // MIDDLEWARE
// // ======================

// const uploadVideo = () => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       ensureDir(TEMP_DIR);
//       ensureDir(HLS_DIR);

//       const busboy = Busboy({
//         headers: req.headers,
//         limits: {
//           files: 1,
//           fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024,
//         },
//       });

//       const fields: Record<string, any> = {};
//       let tempVideoPath = "";
//       let uploadFailed = false;

//       // ======================
//       // FIELD HANDLING
//       // ======================

//       busboy.on("field", (name, value) => {
//         fields[name] = value;
//       });

//       // ======================
//       // FILE HANDLING
//       // ======================

//       busboy.on("file", (fieldname, file, info) => {
//         const { filename, mimeType } = info;

//         // File error
//         file.on("error", (err) => {
//           console.error("File stream error:", err);
//           uploadFailed = true;
//         });

//         // File size limit
//         file.on("limit", () => {
//           uploadFailed = true;

//           res.status(400).json({
//             success: false,
//             message: "File size exceeds limit",
//           });

//           file.resume();
//         });

//         // Only accept "video" field
//         if (fieldname !== "video") {
//           file.resume();
//           return;
//         }

//         // Validate mime type
//         if (!VIDEO_MIME_TYPES.includes(mimeType)) {
//           uploadFailed = true;

//           res.status(400).json({
//             success: false,
//             message: "Invalid video format",
//           });

//           file.resume();
//           return;
//         }

//         const filenameSafe = safeFilename(filename);

//         tempVideoPath = path.join(TEMP_DIR, `${Date.now()}-${filenameSafe}`);

//         const writeStream = fs.createWriteStream(tempVideoPath);

//         writeStream.on("error", (err) => {
//           console.error("Write stream error:", err);
//           uploadFailed = true;
//         });

//         file.pipe(writeStream);
//       });

//       // ======================
//       // BUSBOY ERROR
//       // ======================

//       busboy.on("error", (err) => {
//         console.error("Busboy error:", err);

//         return res.status(500).json({
//           success: false,
//           message: "Upload failed",
//         });
//       });

//       // ======================
//       // FINISH
//       // ======================

//       busboy.on("finish", async () => {
//         try {
//           if (uploadFailed || !tempVideoPath) {
//             return;
//           }

//           const videoId = crypto.randomUUID();

//           const videoHlsDir = path.join(HLS_DIR, videoId);

//           ensureDir(videoHlsDir);

//           const playlistPath = path.join(videoHlsDir, "index.m3u8");

//           const segmentPath = path.join(videoHlsDir, "segment_%03d.ts");

//           const command = ffmpeg(tempVideoPath)
//             .outputOptions([
//               "-preset veryfast",
//               "-g 48",
//               "-sc_threshold 0",
//               "-hls_time 10",
//               "-hls_list_size 0",
//               "-hls_segment_filename",
//               segmentPath,
//             ])
//             .output(playlistPath)
//             .on("end", () => {
//               try {
//                 // delete temp file
//                 if (fs.existsSync(tempVideoPath)) {
//                   fs.unlinkSync(tempVideoPath);
//                 }

//                 // attach to request body
//                 req.body = {
//                   ...fields,
//                   video: `/uploads/hls/${videoId}/index.m3u8`,
//                   videoId,
//                 };

//                 next();
//               } catch (err) {
//                 console.error(err);

//                 return res.status(500).json({
//                   success: false,
//                   message: "Cleanup failed",
//                 });
//               }
//             })
//             .on("error", (err) => {
//               console.error("FFmpeg error:", err);

//               try {
//                 if (fs.existsSync(tempVideoPath)) {
//                   fs.unlinkSync(tempVideoPath);
//                 }
//               } catch {}

//               return res.status(500).json({
//                 success: false,
//                 message: "Video processing failed",
//               });
//             });

//           // timeout protection (30 min)
//           setTimeout(
//             () => {
//               try {
//                 command.kill("SIGKILL");
//               } catch {}
//             },
//             30 * 60 * 1000,
//           );

//           command.run();
//         } catch (err) {
//           console.error(err);

//           return res.status(500).json({
//             success: false,
//             message: "Processing failed",
//           });
//         }
//       });

//       req.pipe(busboy);
//     } catch (err) {
//       console.error(err);

//       return res.status(500).json({
//         success: false,
//         message: "Upload middleware failed",
//       });
//     }
//   };
// };

// export default uploadVideo;

import Busboy from "busboy";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

// ======================
// CONFIGURATION
// ======================

const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_VIDEO_SIZE_MB = 500;
const BASE_UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const TEMP_DIR = path.join(BASE_UPLOAD_DIR, "temp");
const HLS_DIR = path.join(BASE_UPLOAD_DIR, "hls");

// ======================
// HELPERS
// ======================

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const safeFilename = (filename: string) => {
  return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, "_");
};

// ======================
// MIDDLEWARE
// ======================

const uploadVideo = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureDir(TEMP_DIR);
      ensureDir(HLS_DIR);

      const busboy = Busboy({
        headers: req.headers,
        limits: {
          files: 1,
          fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024,
        },
      });

      const fields: Record<string, any> = {};
      let tempVideoPath = "";
      let uploadFailed = false;

      // ======================
      // FIELD HANDLING
      // ======================

      busboy.on("field", (name, value) => {
        fields[name] = value;
      });

      // ======================
      // FILE HANDLING
      // ======================

      busboy.on("file", (fieldname, file, info) => {
        const { filename, mimeType } = info;

        file.on("error", (err) => {
          console.error("File stream error:", err);
          uploadFailed = true;
        });

        file.on("limit", () => {
          uploadFailed = true;

          res.status(400).json({
            success: false,
            message: "File size exceeds limit",
          });

          file.resume();
        });

        // Only accept video field
        if (fieldname !== "video") {
          file.resume();
          return;
        }

        // Validate mime type
        if (!VIDEO_MIME_TYPES.includes(mimeType)) {
          uploadFailed = true;

          res.status(400).json({
            success: false,
            message: "Invalid video format",
          });

          file.resume();
          return;
        }

        const filenameSafe = safeFilename(filename);

        tempVideoPath = path.join(TEMP_DIR, `${Date.now()}-${filenameSafe}`);

        const writeStream = fs.createWriteStream(tempVideoPath);

        writeStream.on("error", (err) => {
          console.error("Write stream error:", err);
          uploadFailed = true;
        });

        file.pipe(writeStream);
      });

      // ======================
      // BUSBOY ERROR
      // ======================

      busboy.on("error", (err) => {
        console.error("Busboy error:", err);

        return res.status(500).json({
          success: false,
          message: "Upload failed",
        });
      });

      // ======================
      // FINISH HANDLING (FIXED)
      // ======================

      busboy.on("finish", async () => {
        try {
          if (uploadFailed) {
            return;
          }

          // ✅ NO VIDEO UPLOADED → skip HLS
          if (!tempVideoPath) {
            req.body = {
              ...fields,
              video: "", // keep default empty string
            };

            return next();
          }

          // ======================
          // PROCESS VIDEO WITH HLS
          // ======================

          const videoId = crypto.randomUUID();

          const videoHlsDir = path.join(HLS_DIR, videoId);

          ensureDir(videoHlsDir);

          const playlistPath = path.join(videoHlsDir, "index.m3u8");

          const segmentPath = path.join(videoHlsDir, "segment_%03d.ts");

          const command = ffmpeg(tempVideoPath)
            .outputOptions([
              "-preset veryfast",
              "-g 48",
              "-sc_threshold 0",
              "-hls_time 10",
              "-hls_list_size 0",
              "-hls_segment_filename",
              segmentPath,
            ])
            .output(playlistPath)
            .on("end", () => {
              try {
                if (fs.existsSync(tempVideoPath)) {
                  fs.unlinkSync(tempVideoPath);
                }

                req.body = {
                  ...fields,
                  video: `/uploads/hls/${videoId}/index.m3u8`,
                };

                next();
              } catch (err) {
                console.error(err);

                return res.status(500).json({
                  success: false,
                  message: "Cleanup failed",
                });
              }
            })
            .on("error", (err) => {
              console.error("FFmpeg error:", err);

              try {
                if (fs.existsSync(tempVideoPath)) {
                  fs.unlinkSync(tempVideoPath);
                }
              } catch {}

              return res.status(500).json({
                success: false,
                message: "Video processing failed",
              });
            });

          // timeout protection
          setTimeout(
            () => {
              try {
                command.kill("SIGKILL");
              } catch {}
            },
            30 * 60 * 1000,
          );

          command.run();
        } catch (err) {
          console.error(err);

          return res.status(500).json({
            success: false,
            message: "Processing failed",
          });
        }
      });

      req.pipe(busboy);
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Upload middleware failed",
      });
    }
  };
};

export default uploadVideo;
