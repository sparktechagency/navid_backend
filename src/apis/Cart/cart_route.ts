import express from "express";
import asyncWrapper from "../../middleware/asyncWrapper";
import verifyToken from "../../middleware/verifyToken";
import config from "../../DefaultConfig/config";
import { cart_controller } from "./cart_controller";

export const cart_router = express.Router();

cart_router
  .post(
    "/cart/create",
    verifyToken(config.USER),
    asyncWrapper(cart_controller.create_or_update),
  )

  .get(
    "/cart/get-all",
    verifyToken(config.USER),
    asyncWrapper(cart_controller.get_all),
  )

  .delete(
    "/cart/delete/:id",
    verifyToken(config.USER),
    asyncWrapper(cart_controller.delete_cart),
  )

  .delete(
    "/cart/delete-item/:id",
    verifyToken(config.USER),
    asyncWrapper(cart_controller.delete_cart_item),
  )
  .patch('/cart/update/:id',
    verifyToken(config.USER),
    asyncWrapper(cart_controller.update)
  )
