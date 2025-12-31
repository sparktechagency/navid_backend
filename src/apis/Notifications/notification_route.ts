import express from "express";
import asyncWrapper from "../../middleware/asyncWrapper";
import verifyToken from "../../middleware/verifyToken";
import config from "../../DefaultConfig/config";
import { notification_controller } from "./notificatioin_controller";

export const notification_router = express.Router();

notification_router
  .get(
    "/notification/get-all",
    verifyToken(config.USER),
    asyncWrapper(notification_controller.get_all),
  )

  .patch(
    "/notification/read/:id",
    verifyToken(config.USER),
    asyncWrapper(notification_controller.read),
  )

  .delete(
    "/notification/delete/:id",
    verifyToken(config.USER),
    asyncWrapper(notification_controller.remove),
  );


