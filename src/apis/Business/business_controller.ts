import { Request, Response } from "express";
import { HttpStatus } from "../../DefaultConfig/config";
import { SearchKeys } from "../../utils/Queries";
import { sendResponse } from "../../utils/sendResponse";
import { business_service } from "./business_service";

const create = async (req: Request, res: Response) => {
  const business_documents =
    (!Array.isArray(req.files) &&
      req.files?.business_documents &&
      req.files.business_documents.length > 0 &&
      req.files.business_documents.map((doc: any) => doc.path)) ||
    [];
  const logo =
    (!Array.isArray(req.files) &&
      req.files?.logo &&
      req.files.logo.length > 0 &&
      req.files.logo[0]?.path) ||
    null;

  req.body.logo = logo;

  req.body.business_documents = business_documents;

  const result = await business_service.create(req?.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_all = async (req: Request, res: Response) => {
  const { search, ...other_fields } = req.query;
  let searchKeys = {} as SearchKeys;

  let queryKeys = { ...other_fields };

  if (search) searchKeys.name = search as string;

  const populatePath = "user";

  const selectFields = "";
  const result = await business_service.get_all(
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const update = async (req: Request, res: Response) => {
  const logo =
    (!Array.isArray(req.files) &&
      req.files?.logo &&
      req.files.logo.length > 0 &&
      req.files.logo[0]?.path) ||
    null;

  const business_documents =
    (!Array.isArray(req.files) &&
      req.files?.business_documents &&
      req.files.business_documents.length > 0 &&
      req.files.business_documents.map((doc: any) => doc.path)) ||
    [];

  if (logo) req.body.logo = logo;

  if (business_documents) req.body.business_documents = business_documents;

  req.body.user = req?.user?._id;

  const result = await business_service.update(req?.params?.id?.toString() as string, req?.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const delete_business = async (req: Request, res: Response) => {
  const result = await business_service.delete_business(
    req?.params?.id?.toString() as string,
    req?.user?._id?.toString() as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const approve_shop = async (req: Request, res: Response) => {
  const result = await business_service.approve_shop(
    req?.params?.id?.toString() as string,
    req?.user?._id?.toString() as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const block_shop = async (req: Request, res: Response) => {
  const result = await business_service.block_shop(
    req?.params?.id?.toString() as string,
    req?.user?._id?.toString() as string,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
};

export const business_controller = Object.freeze({
  create,
  get_all,
  update,
  delete_business,
  approve_shop,
  block_shop,
});
