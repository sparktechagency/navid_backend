
import { Request, Response } from "express";
import { HttpStatus } from "../../DefaultConfig/config";
import { QueryKeys } from '../../utils/Aggregator';
import { sendResponse } from "../../utils/sendResponse";
import { SearchKeys } from './../../utils/Queries';
import { variants_service } from "./variants_service";

const create = async (req: Request, res: Response) => {
  const img = !Array.isArray(req.files) && req.files?.img && req.files.img.length > 0 && req.files.img?.map(file => file.path) || null;

  if (img) req.body.img = img;

  const result = await variants_service.create(req?.body)
  sendResponse(
    res,
    HttpStatus.CREATED,
    result
  )
}

const get_all = async (req: Request, res: Response) => {

  const { search, is_deleted, ...otherValues } = req?.query;
  const searchKeys: SearchKeys = {}

  if (search) searchKeys.name = search as string

  const queryKeys = {
    is_deleted: { $ne: true },
    ...otherValues,
  } as QueryKeys
  if (is_deleted && is_deleted == 'true') {
    queryKeys.is_deleted = true
  }

  const result = await variants_service.get_all(queryKeys, searchKeys)
  sendResponse(
    res,
    HttpStatus.SUCCESS,
    result
  )
}


const update = async (req: Request, res: Response) => {

  const { remaining_image } = req.body
  const img = !Array.isArray(req.files) && req.files?.img && req.files.img.length > 0 && req.files.img?.map(file => file.path);
  if (img) {
    const combined_image = remaining_image ? [...img, ...JSON.parse(remaining_image)] : img;
    req.body.img = combined_image;
  } else if (remaining_image) {
    req.body.img = JSON.parse(remaining_image);
  }


  const result = await variants_service.update(req?.params?.id?.toString(), req?.body)
  sendResponse(
    res,
    HttpStatus.SUCCESS,
    result
  )
}

const delete_variants = async (req: Request, res: Response) => {
  const result = await variants_service.delete_variants(req?.params?.id?.toString())
  sendResponse(
    res,
    HttpStatus.SUCCESS,
    result
  )
}

export const variants_controller = {
  create,
  get_all,
  update,
  delete_variants
}
