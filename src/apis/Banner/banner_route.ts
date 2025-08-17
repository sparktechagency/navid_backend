import express from "express";
import config from "../../DefaultConfig/config";
import asyncWrapper from "../../middleware/asyncWrapper";
import uploadFile from "../../middleware/fileUploader";
import verifyToken from "../../middleware/verifyToken";
import { banner_controller } from "./banner_controller";

export const banner_router = express.Router();

banner_router
  .post(
    "/banner/create",
    uploadFile(),
    verifyToken(config.ADMIN),
    asyncWrapper(banner_controller.create),
  )

  .get("/banner/get-all", asyncWrapper(banner_controller.get_all))

  .patch(
    "/banner/update/:id",
    uploadFile(),
    verifyToken(config.ADMIN),
    asyncWrapper(banner_controller.update),
  )

  .delete(
    "/banner/delete/:id",
    verifyToken(config.ADMIN),
    asyncWrapper(banner_controller.delete_banner),
  );
