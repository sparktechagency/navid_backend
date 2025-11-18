import { Request, Response } from "express";
import { order_service } from "./order_service";
import { sendResponse } from "../../utils/sendResponse";
import { HttpStatus } from "../../DefaultConfig/config";
import { IAuth } from "../Auth/auth_types";

const create_order = async (req: Request, res: Response) => {
  const result = await order_service.create_order(
    req.body,
    req?.user?._id as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_all = async (req: Request, res: Response) => {
  const { search, ...other_fields } = req.query;
  let queryKeys = { ...other_fields };

  let populatePath = [
    "items.product",
    "user",
    "items.variant",
    "delivery_address",
    "pick_up_address",
  ];
  let selectFields = [
    "name img price",
    "name img email phone",
    "img price_after_discount discount quantity color size",
    "name phone address",
    "name phone address",
  ];

  const { role, _id } = req?.user as IAuth;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    queryKeys.user = _id as string;
    populatePath = ["items.product", "user", "items.variant", "delivery_address", "pick_up_address"];
    selectFields = [
      "name img price",
      "name email address",
      "img price_after_discount price discount quantity color size",
      "name phone address",
      "name phone address",
    ];
  }

  let searchKeys = {} as { email: string };
  if (search) searchKeys.email = search as string;

  const result = await order_service.get_all(
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_order_details = async (req: Request, res: Response) => {
  const result = await order_service.get_order_details(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const update_order = async (req: Request, res: Response) => {
  const result = await order_service.update_order(req?.params?.id, req?.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const delete_order = async (req: Request, res: Response) => {
  const result = await order_service.delete_order(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const update_delivery_status = async (req: Request, res: Response) => {
  const result = await order_service.update_delivery_status(
    req?.params?.id,
    req?.body?.delivery_status,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

export const order_controller = Object.freeze({
  create_order,
  get_all,
  get_order_details,
  update_order,
  delete_order,
  update_delivery_status,
});
