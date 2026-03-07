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

// import Busboy from "busboy";
// import crypto from "crypto";
// import { NextFunction, Request, Response } from "express";
// import ffmpeg from "fluent-ffmpeg";
// import fs from "fs";
// import path from "path";

// ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

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

//         file.on("error", (err) => {
//           console.error("File stream error:", err);
//           uploadFailed = true;
//         });

//         file.on("limit", () => {
//           uploadFailed = true;

//           res.status(400).json({
//             success: false,
//             message: "File size exceeds limit",
//           });

//           file.resume();
//         });

//         // Only accept video field
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
//       // FINISH HANDLING
//       // ======================

//       busboy.on("finish", async () => {
//         try {
//           if (uploadFailed) {
//             return;
//           }

//           // NO VIDEO UPLOADED → skip HLS
//           if (!tempVideoPath) {
//             req.body = {
//               ...fields,
//               video: "",
//             };

//             return next();
//           }

//           // ======================
//           // PROCESS VIDEO WITH HLS
//           // ======================

//           const videoId = crypto.randomUUID();

//           const videoHlsDir = path.join(HLS_DIR, videoId);

//           ensureDir(videoHlsDir);

//           const playlistPath = path.join(videoHlsDir, "index.m3u8");

//           const segmentPath = path.join(videoHlsDir, "segment_%03d.ts");

//           const command = ffmpeg(tempVideoPath)
//             .outputOptions([
//               "-c:v libx264", // transcode to H.264
//               "-profile:v baseline", // ← universal Android compatibility
//               "-level 3.1", // ← safe for all mobile devices
//               "-pix_fmt yuv420p", // ← fixes 10-bit crash on Android (root cause)
//               "-crf 23", // quality (18=best, 28=smallest, 23=balanced)
//               "-preset veryfast", // fast encoding
//               "-c:a aac", // universal audio codec
//               "-b:a 128k", // standard audio bitrate
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
//                 if (fs.existsSync(tempVideoPath)) {
//                   fs.unlinkSync(tempVideoPath);
//                 }

//                 req.body = {
//                   ...fields,
//                   video: `/uploads/hls/${videoId}/index.m3u8`,
//                 };

//                 next();
//               } catch (err) {
//                 console.error("Cleanup error:", err);

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

//           // 30 min timeout protection
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
//           console.error("Finish handler error:", err);

//           return res.status(500).json({
//             success: false,
//             message: "Processing failed",
//           });
//         }
//       });

//       req.pipe(busboy);
//     } catch (err) {
//       console.error("Middleware error:", err);

//       return res.status(500).json({
//         success: false,
//         message: "Upload middleware failed",
//       });
//     }
//   };
// };

// export default uploadVideo;
