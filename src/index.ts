import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import dns from "node:dns";
import path from "path";
import { payment_controller } from "./apis/Payment/payment_controller";
import { connectToDB } from "./db";
import config from "./DefaultConfig/config";
import asyncWrapper from "./middleware/asyncWrapper";
import middleware from "./middleware/middleware";
import { routeMiddleware } from "./middleware/routeMiddleware";
import { app, server } from "./socket";
import globalErrorHandler, { CustomError } from "./utils/globalErrorHandler";
import { logger } from "./utils/logger";
dns.setDefaultResultOrder("ipv4first");
dotenv.config();
app.use(
  cors({
    origin: [
      "https://admin.divandione.com",
      "https://divandione.com",
      "http://localhost:3000",
    ],
    // origin: '*',
    credentials: true,
  }),
);

const uploadDir =
  process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads folder at ${uploadDir}`);
}
app.use("/uploads", express.static(uploadDir));
// post payment
app.post(
  "/payment/complete",
  express.raw({ type: "application/json" }),
  asyncWrapper(payment_controller.webhook),
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req: Request, res: Response) => {
  res.render("default");
});

middleware(app);
// route middleware
routeMiddleware(app);

app.use(globalErrorHandler);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(
    `Can't find ${req.originalUrl} on the server`,
    404,
  );
  globalErrorHandler(error, req, res, next);
});
function main() {
  try {
    // server.listen(Number(config?.PORT), config?.IP, async () => {
    server.listen(Number(config?.PORT), config?.IP, async () => {
      logger.info("server is running");
      await connectToDB();
      logger.info(
        `Worker process ${process.pid} is running on port ${config.PORT}`,
      );

      // automation()
      // new seed()

      // Error handling for worker processes
      process.on("uncaughtException", (error) => {
        console.error("Uncaught Exception:", error.message);
        console.error(error.stack);
      });

      process.on("unhandledRejection", (reason, promise) => {
        console.error("Unhandled Rejection at:", promise, "reason:", reason);
      });

      process.on("SIGTERM", () => {
        console.log(
          `Worker process ${process.pid} received SIGTERM. Shutting down gracefully.`,
        );
        process.exit(0);
      });

      process.on("SIGINT", () => {
        console.log(
          `Worker process ${process.pid} received SIGINT. Shutting down gracefully.`,
        );
        //   process.exit(0);
      });
    });
  } catch (error) {
    console.log(error);
    // logger.error(error)
  }
}

main();
// }
