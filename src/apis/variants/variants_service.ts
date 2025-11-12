

import mongoose, { model } from 'mongoose';
import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { variants_model } from "./variants_model";
import { service_model } from '../Service/service_model';
import { IAuth } from '../Auth/auth_types';
import bcrypt from 'bcrypt'
import Aggregator from '../../utils/Aggregator';

const create = async (data: { [key: string]: string }) => {
  await variants_model.create(data)
  return {
    success: true,
    message: 'variants created successfully',
  }
}

const get_all = async (queryKeys: QueryKeys, searchKeys: SearchKeys) => {
  return await Aggregator(variants_model, queryKeys, searchKeys, [])
}

const update = async (id: string, data: { [key: string]: string }) => {
  const res = await variants_model.findByIdAndUpdate(id, {
    $set: {
      ...data
    }
  })

  return {
    success: true,
    message: 'variants updated successfully',
    data: res
  }
}

const delete_variants = async (id: string) => {
  const variant = await variants_model.findById(id);
  if (!variant) {
    return {
      success: false,
      message: "Variant not found",
    };
  }

  const updated = await variants_model.findByIdAndUpdate(
    id,
    { $set: { is_deleted: !variant.is_deleted } },
    { new: true }
  );

  return {
    success: true,
    message: `Variant ${updated && updated.is_deleted ? "deleted" : "restored"} successfully`,
    data: updated,
  };
};


export const variants_service = Object.freeze({
  create,
  get_all,
  update,
  delete_variants
})
