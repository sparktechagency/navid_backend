import { Request, Response } from "express";
import mongoose from "mongoose";
import { HttpStatus } from "../../DefaultConfig/config";
import { UnlinkFiles } from "../../middleware/fileUploader";
import { QueryKeys } from "../../utils/Aggregator";
import { sendResponse } from "../../utils/sendResponse";
import { product_service } from "./product_service";
import IProduct from "./product_type";

const create = async (req: Request, res: Response) => {
  req.body.user = req.user?._id;

  const result = await product_service.create(req.body);
  sendResponse(res, HttpStatus.SUCCESS, result);
};

const get_all = async function (req: Request, res: Response) {
  const { search, whole_sale, category, sub_category, is_deleted, ...other_fields } = req.query;

  let searchKeys = {} as { name: string };

  let queryKeys = { ...other_fields, is_deleted: { $ne: true } } as QueryKeys;

  if (search) searchKeys.name = search as string;

  if (whole_sale == "true") {
    queryKeys.whole_sale = true;
  } else {
    queryKeys.whole_sale = false;
  }
  if (is_deleted && is_deleted == 'true') {
    queryKeys.is_deleted = true
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

// const update = async function (req: Request, res: Response) {
//   const { retained_variants: prev, deleted_variants: del, ...data } = req.body;

//   const retained_variants = JSON.parse(prev);
//   const deleted_variants = JSON.parse(del);


//   const merge_variants = product_service.merge_variants(
//     retained_variants,
//     deleted_variants,
//   );
//   if (deleted_variants && deleted_variants.length > 0) {
//     UnlinkFiles(deleted_variants);
//   }
//   // console.log(data, merge_variants, deleted_variants);

//   const result = await product_service.update_product(req?.params?.id, {
//     ...data,
//     variants: merge_variants,
//   });

//   sendResponse(res, HttpStatus.SUCCESS, result);
// };

export const update = async (req: Request, res: Response) => {
  try {
    const { name, description, category, sub_category, whole_sale } = req.body;
    const { id } = req.params;
    
    const video = !Array.isArray(req.files) && req.files?.video && req.files.video.length > 0 && req.files.video[0]?.path || null;
    console.log(video)
    if (video) req.body.video = video


    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if ([name, description, category, sub_category].some((item) => !item)) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }
    let whole_sale_value: boolean;
    whole_sale_value = typeof whole_sale === "string" ? whole_sale === "true" ? true : false : whole_sale;

    if (typeof whole_sale_value !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid value for whole_sale (must be boolean)",
      });
    }

    const updateData = {
      name,
      description,
      category,
      sub_category,
      whole_sale: whole_sale_value,
      video,
    };

    const result = await product_service.update_product(id, updateData as IProduct);

    if (!result?.data) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
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
