import { Request, Response } from "express";
import { setting_service } from "./setting_service";
import { sendResponse } from "../../utils/sendResponse";
import { HttpStatus } from "../../DefaultConfig/config";

async function create(req: Request, res: Response) {
  const result = await setting_service.create(req.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function get(req: Request, res: Response) {
  const result = await setting_service.get(req?.params?.name as string);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

export const setting_controller = Object.freeze({
  create,
  get,
});
