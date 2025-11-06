import mongoose, { model } from "mongoose";
import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { category_model } from "./category_model";
import { service_model } from "../Service/service_model";
import { IAuth } from "../Auth/auth_types";
import bcrypt from "bcrypt";
import Aggregator from "../../utils/Aggregator";
async function create(data: { [key: string]: string }) {
  const result = await category_model.create(data);
  return {
    success: true,
    message: "category created successfully",
    data: result,
  };
}

async function get_all(
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?: any,
  selectFields?: string | string[],
  modelSelect?: string,
) {
  return await Aggregator(category_model, queryKeys, searchKeys, [
    {
      $lookup: {
        from: "services",
        localField: "_id",
        foreignField: "category",
        as: "services",
      },
    },
    {
      $addFields: {
        is_service: {
          $cond: {
            if: { $gt: [{ $size: "$services" }, 0] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        img: 1,
        is_service: 1,
        _id: 1,
        

      }
    }
  ]);
}

async function update(id: string, data: { [key: string]: string }) {
  const result = await category_model.findByIdAndUpdate(
    id,
    {
      $set: {
        ...data,
      },
    },
    { new: true },
  );

  return {
    success: true,
    message: "category updated successfully",
    data: result,
  };
}

async function delete_category(
  id: string,
  data: { [key: string]: string },
  auth: IAuth,
) {
  const is_exists = await category_model.findOne({ _id: id, name: data?.name });

  if (!is_exists) throw new Error(`category not found`);

  const is_pass_mass = await bcrypt.compare(data?.password, auth?.password);

  if (!is_pass_mass) throw new Error(`password doesn't match`);

  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const [result] = await Promise.all([
        category_model.findByIdAndDelete(id, { session }),
        service_model.deleteMany({ category: id }, { session }),
      ]);
      return result;
    });
    return {
      success: true,
      message: "category deleted successfully",
      data: result,
    };
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}

export const category_service = Object.freeze({
  create,
  get_all,
  update,
  delete_category,
});
