import { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { HttpStatus } from "../../DefaultConfig/config";
import { cart_service } from "./cart_service";
import { SearchKeys } from "../../utils/Queries";

const create_or_update = async (req: Request, res: Response) => {
  req.body.user = req?.user?._id;
  const result = await cart_service.create_or_update(req?.body);
  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_all = async (req: Request, res: Response) => {
  const { search, order, ...other_fields } = req.query;
  let searchKeys = {} as SearchKeys;
  let queryKeys = { ...other_fields };

  if (search) searchKeys.name = search as string;
  queryKeys.user = req.user?._id as string;

  const populatePath = "items.product_id";
  const selectFields = "name price discount";

  const result = await cart_service.get_all(
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
    order as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const delete_cart = async (req: Request, res: Response) => {
  const result = await cart_service.delete_cart(req?.params?.id as string);
  sendResponse(res, HttpStatus.SUCCESS, result);
};

const update = async (req: Request, res: Response) => {
  const result = await cart_service.update(
    req?.params?.id as string,
    req?.body,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const delete_cart_item = async (req: Request, res: Response) => {

  const result = await cart_service.delete_cart_item(
    req?.params?.id as string,
    req?.user?._id?.toString() as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

export const cart_controller = Object.freeze({
  create_or_update,
  get_all,
  update,
  delete_cart,
  delete_cart_item,
});
