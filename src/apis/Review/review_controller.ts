import { Request, Response } from "express";
import { HttpStatus } from "../../DefaultConfig/config";
import { sendResponse } from "../../utils/sendResponse";
import { review_service } from "./review_service";
import { SearchKeys } from "../../utils/Queries";

async function create(req: Request, res: Response) {
  req.body.user = req?.user?._id;

  const img =
    (!Array.isArray(req.files) &&
      req.files?.img &&
      req.files.img.length > 0 &&
      req.files.img?.map((doc: any) => doc.path)) ||
    null;
  if (img) req.body.img = img;

  const result = await review_service.create(req?.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function approve(req: Request, res: Response) {
  const result = await review_service.approve(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function delete_review(req: Request, res: Response) {
  const result = await review_service.delete_review(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function get_all(req: Request, res: Response) {
  const { search, ...otherValues } = req?.query;
  const searchKeys: SearchKeys = {};

  if (search) searchKeys.name = search as string;

  const queryKeys = {
    ...otherValues,
  };

  const populatePath: string | string[] = "user";
  const selectFields: string | string[] = "name img _id";
  const modelSelect: string = "";

  const result = await review_service.get_all(
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
    modelSelect,
  );
  sendResponse(res, HttpStatus.SUCCESS, result);
}

export const review_controller = Object.freeze({
  create,
  delete_review,
  approve,
  get_all,
});
