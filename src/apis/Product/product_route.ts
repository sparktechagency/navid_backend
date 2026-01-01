import express from "express";
import config from "../../DefaultConfig/config";
import asyncWrapper from "../../middleware/asyncWrapper";
import upload_product_image from "../../middleware/prouct_image_upload";
import verifyToken from "../../middleware/verifyToken";
import { product_controller } from "./product_controller";
import uploadFile from "../../middleware/fileUploader";
import uploadVideo from "../../middleware/uploadVideo";

export const product_router = express.Router();

product_router
// .post(
//   "/product/create",
//   verifyToken(config.ADMIN),
//   uploadFile(),
//   asyncWrapper(product_controller.create),
// )
product_router
  .post(
    "/product/create",
    verifyToken(config.ADMIN),
    uploadVideo(),
    asyncWrapper(product_controller.create),
  )

  .get(
    "/product/get-all",
    verifyToken(config.USER, false),
    asyncWrapper(product_controller.get_all),
  )

  .get(
    "/product/get-details/:id",
    verifyToken(config.USER, false),
    asyncWrapper(product_controller.get_product_details),
  )

  .patch(
    "/product/update/:id",
    verifyToken(config.ADMIN),
    uploadFile(),
    asyncWrapper(product_controller.update),
  )

  .delete(
    "/product/delete/:id",
    verifyToken(config.ADMIN),
    asyncWrapper(product_controller.delete_product),
  );

// .patch(
//     '/product/approve/:id',
//     verifyToken(config.ADMIN),
//     asyncWrapper(product_controller.approve_product)
// )

// .patch(
//     '/product/feature/:id',
//     verifyToken(config.ADMIN),
//     asyncWrapper(product_controller.feature_product)
// )
