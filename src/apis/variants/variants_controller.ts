
import { SearchKeys } from './../../utils/Queries';
import { Request, Response } from "express";
import { variants_service } from "./variants_service";
import { sendResponse } from "../../utils/sendResponse";
import { HttpStatus } from "../../DefaultConfig/config";
import { IAuth } from '../Auth/auth_types';

const create = async (req: Request, res: Response) => {
    const img = !Array.isArray(req.files) && req.files?.img && req.files.img.length > 0 && req.files.img[0]?.path || null;

    if (img) req.body.img = img

    const result = await variants_service.create(req?.body)
    sendResponse(
        res,
        HttpStatus.CREATED,
        result
    )
}

const get_all = async (req: Request, res: Response) => {

    const { search, ...otherValues } = req?.query;
    const searchKeys: SearchKeys = {}

    if (search) searchKeys.name = search as string

    const queryKeys = {
        ...otherValues,
        is_deleted: { $ne: true }
    }

    const result = await variants_service.get_all(queryKeys, searchKeys)
    sendResponse(
        res,
        HttpStatus.SUCCESS,
        result
    )
}


const update = async (req: Request, res: Response) => {
    const img = !Array.isArray(req.files) && req.files?.img && req.files.img.length > 0 && req.files.img[0]?.path || null;

    if (img) req.body.img = img

    const result = await variants_service.update(req?.params?.id, req?.body)
    sendResponse(
        res,
        HttpStatus.SUCCESS,
        result
    )
}

const delete_variants = async (req: Request, res: Response) => {

    const result = await variants_service.delete_variants(req?.params?.id)
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
