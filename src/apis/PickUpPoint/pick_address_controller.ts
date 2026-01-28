import { Request, Response } from "express";
import { HttpStatus } from "../../DefaultConfig/config";
import { sendResponse } from "../../utils/sendResponse";
import { pick_address_service } from "./pick_address_service";

const create = async (req: Request, res: Response) => {
  req.body.user = req?.user?._id;
  const result = await pick_address_service.create(req?.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_all = async (req: Request, res: Response) => {
  const result = await pick_address_service.get_all(req?.user?._id?.toString() as string);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const update = async (req: Request, res: Response) => {
  const result = await pick_address_service.update(
    req?.params?.id?.toString() as string,
    req?.user?._id?.toString() as string,
    req?.body,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const delete_shipping_address = async (req: Request, res: Response) => {
  const result = await pick_address_service.delete_shipping_address(
    req?.params?.id?.toString() as string,
    req?.user?._id?.toString() as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

export const pick_address_controller = {
  create,
  get_all,
  update,
  delete_shipping_address,
};
