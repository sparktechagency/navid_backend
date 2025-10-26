import { Request, Response } from "express";
import config, { HttpStatus } from "../../DefaultConfig/config";
import { sendResponse } from "../../utils/sendResponse";
import { QueryKeys } from "./../../utils/Aggregator";
import { SearchKeys } from "./../../utils/Queries";
import { auth_service } from "./auth_service";
import { IAuth } from "./auth_types";

async function create(req: Request, res: Response) {
  const result = await auth_service.sign_up(req.body);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function sing_in(req: Request, res: Response) {
  const result = await auth_service.sing_in(req.body);
  console.log("=================",result)
  sendResponse(res, HttpStatus.SUCCESS, result, [
    config.TOKEN_NAME,
    result?.token,
    60 * 60 * 24 * 500 * 1000,
  ]);
}

async function sing_out(req: Request, res: Response) {
  res.clearCookie(config.TOKEN_NAME);
  res
    .cookie(config.TOKEN_NAME, "", {
      maxAge: 0,
      expires: new Date(),
      sameSite: "none",
      httpOnly: false,
      secure: false,
    })
    .status(200)
    .send({ success: true, message: "user sign out successfully" });
}

async function block_auth(req: Request, res: Response) {
  const result = await auth_service.block_auth(req?.params?.id);
  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function get_profile(req: Request, res: Response) {
  const result = await auth_service.get_profile(req?.user as IAuth);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function update_auth(req: Request, res: Response) {
  const {
    is_identity_verified,
    is_verified,
    role,
    email,
    accessToken,
    confirm_password,
    provider,
    block,
    ...otherValues
  } = req?.body;

  const img =
    (!Array.isArray(req.files) &&
      req.files?.img &&
      req.files.img.length > 0 &&
      req.files.img[0]?.path) ||
    null;

  const documents =
    (!Array.isArray(req.files) &&
      req.files?.documents &&
      req.files.documents.length > 0 &&
      req.files.documents?.map((doc: any) => doc.path)) ||
    null;

  if (documents) otherValues.documents = documents;
  if (img) otherValues.img = img;

  const result = await auth_service.update_auth(
    { ...otherValues },
    req?.user as IAuth,
  );

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function reset_password(req: Request, res: Response) {
  const result = await auth_service.reset_password(
    req?.body,
    req?.user as IAuth,
  );

  sendResponse(res, HttpStatus.SUCCESS, result, [
    config.TOKEN_NAME,
    result?.token,
    60 * 60 * 24 * 500 * 1000,
  ]);
}

async function change_password(req: Request, res: Response) {
  const result = await auth_service.change_password(
    req?.body,
    req?.user as IAuth,
  );

  sendResponse(res, HttpStatus.SUCCESS, result, [
    config.TOKEN_NAME,
    result?.token,
    60 * 60 * 24 * 500 * 1000,
  ]);
}

async function verify_identity(req: Request, res: Response) {
  const result = await auth_service.verify_identity(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

async function get_all(req: Request, res: Response) {
  const { search, ...other_values } = req.query;

  const SearchKeys = {} as SearchKeys;
  if (search) SearchKeys.name = search as string;

  const QueryKeys = { ...other_values, role: "USER" } as QueryKeys;

  const result = await auth_service.get_all(QueryKeys, SearchKeys);

  sendResponse(res, HttpStatus.SUCCESS, result);
}

export const auth_controller = Object.freeze({
  create,
  sing_in,
  sing_out,
  block_auth,
  get_profile,
  update_auth,
  reset_password,
  change_password,
  verify_identity,
  get_all,
});
