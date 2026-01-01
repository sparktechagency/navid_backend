import { Request, Response, NextFunction } from "express";
import Busboy from "busboy";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath as string);

const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_SIZE_MB = 5000;

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const uploadVideo = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024,
      },
    });

    const fields: Record<string, any> = {};
    let tempVideoPath = "";

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;

      if (fieldname !== "video") {
        file.resume();
        return;
      }

      if (!VIDEO_MIME_TYPES.includes(mimeType)) {
        file.resume();
        return res.status(400).json({
          success: false,
          message: "Invalid video format",
        });
      }

      const tempDir = path.join("uploads", "temp");
      ensureDir(tempDir);

      tempVideoPath = path.join(tempDir, `${Date.now()}-${filename}`);
      file.pipe(fs.createWriteStream(tempVideoPath));
    });

    busboy.on("finish", () => {
      if (!tempVideoPath) {
        return res.status(400).json({
          success: false,
          message: "Video not uploaded",
        });
      }

      const videoId = Date.now().toString();
      const hlsDir = path.join("uploads", "hls", videoId);
      ensureDir(hlsDir);

      const playlistPath = path.join(hlsDir, "index.m3u8");

      ffmpeg(tempVideoPath)
        .outputOptions([
          "-preset veryfast",
          "-g 48",
          "-sc_threshold 0",
          "-hls_time 6",
          "-hls_list_size 0",
          "-hls_segment_filename",
          path.join(hlsDir, "segment_%03d.ts"),
        ])
        .output(playlistPath)
        .on("end", () => {
          fs.unlinkSync(tempVideoPath);

          // ✅ IMPORTANT FIX
          req.body = {
            ...fields,
            video: playlistPath,
          };

          next();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          return res.status(500).json({
            success: false,
            message: "HLS conversion failed",
          });
        })
        .run();
    });

    req.pipe(busboy);
  };
};

export default uploadVideo;
