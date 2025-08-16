import { Request, Response } from "express";
import mongoose from "mongoose";
import { HttpStatus } from "../../DefaultConfig/config";
import { UnlinkFiles } from "../../middleware/fileUploader";
import { QueryKeys } from "../../utils/Aggregator";
import { sendResponse } from "../../utils/sendResponse";
import { product_service } from "./product_service";

const create = async function (req: Request, res: Response) {
  const data = req.body;

  const variants_formate = product_service.formate_variant(req);

  if (variants_formate && variants_formate?.length > 0)
    data.variants = variants_formate;

  data.user = req?.user?._id;
  data.quantity = data?.variants?.reduce(
    (acc: number, curr: any) => acc + curr.quantity,
    0
  );
  const result = await product_service.create(data);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_all = async function (req: Request, res: Response) {
  const { search, whole_sale, category, sub_category, ...other_fields } = req.query;

  let searchKeys = {} as { name: string };

  let queryKeys = { ...other_fields } as QueryKeys;

  if (search) searchKeys.name = search as string;

  if (whole_sale == "true") {
    queryKeys.whole_sale = true;
  } else {
    queryKeys.whole_sale = false;
  }

  if (category)
    queryKeys.category = new mongoose.Types.ObjectId(category as string);
  if (sub_category)
    queryKeys.sub_category = new mongoose.Types.ObjectId(sub_category as string);
  if (
    !req?.user?.tax_id &&
    whole_sale == "true" &&
    req?.user?.role != "ADMIN" &&
    req?.user?.role != "SUPER_ADMIN"
  ) {
    return sendResponse(res, HttpStatus.SUCCESS, {
      status: false,
      message: "Please add tax id",
      data: [],
    });
  }
  const result = await product_service.get_all(queryKeys, searchKeys);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_product_details = async function (req: Request, res: Response) {
  const result = await product_service.get_details(req?.params?.id, req?.user?.tax_id as string);
  sendResponse(res, HttpStatus.SUCCESS, result);
};

const update = async function (req: Request, res: Response) {
  const { retained_variants: prev, deleted_variants: del, ...data } = req.body;

  const retained_variants = JSON.parse(prev);
  const deleted_variants = JSON.parse(del);

  const variants_formate = product_service.formate_variant(req);

  const merge_variants = product_service.merge_variants(
    retained_variants,
    variants_formate,
  );
  if (deleted_variants && deleted_variants.length > 0) {
    UnlinkFiles(deleted_variants);
  }
  // console.log(data, merge_variants, deleted_variants);

  const result = await product_service.update_product(req?.params?.id, {
    ...data,
    variants: merge_variants,
  });

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const delete_product = async function (req: Request, res: Response) {
  const result = await product_service.delete_product(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const approve_product = async function (req: Request, res: Response) {
  const result = await product_service.approve_product(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

const feature_product = async function (req: Request, res: Response) {
  const result = await product_service.feature_product(req?.params?.id);

  sendResponse(res, HttpStatus.SUCCESS, result);
};

export const product_controller = Object.freeze({
  create,
  get_all,
  get_product_details,
  update,
  delete_product,
  approve_product,
  feature_product,
});
