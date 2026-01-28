import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { business_model } from "./business_model";
import { IBusiness } from "./business_type";

const create = async (data: IBusiness) => {
  const result = await business_model.create(data);

  return {
    success: true,
    message: "business created successfully",
    data: result,
  };
};

const update = async (id: string, data: IBusiness) => {
  const result = await business_model.findOneAndUpdate(
    { _id: id, user: data.user },
    {
      $set: {
        ...data,
      },
    },
    { new: true },
  );

  if (!result) throw new Error("Business not found");

  return {
    success: true,
    message: "business updated successfully",
    data: result,
  };
};

const delete_business = async (id: string, user: string) => {
  const result = await business_model.findOneAndDelete({ _id: id, user });

  if (!result) throw new Error("Business not found");

  return {
    success: true,
    message: "business deleted successfully",
    data: result,
  };
};

const block_shop = async (id: string, user: string) => {
  const result = await business_model.findOneAndUpdate(
    { _id: id, user },
    {
      $set: {
        $cond: {
          if: { $eq: ["$block", false] },
          then: true,
          else: false,
        },
      },
    },
    { new: true },
  );

  if (!result) throw new Error("Business not found");

  return {
    success: true,
    message: `block business ${result?.block ? "unblocked" : "blocked"} successfully`,
    data: result,
  };
};

const approve_shop = async (id: string, user: string) => {
  const result = await business_model.findOneAndUpdate(
    { _id: id, user },
    {
      $set: {
        is_approved: true,
      },
    },
    { new: true },
  );

  if (!result) throw new Error("Business not found");

  return {
    success: true,
    message: "business approved successfully",
    data: result,
  };
};

const get_all = async (
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?: any,
  selectFields?: string | string[],
) => {
  return await Queries(
    business_model,
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
  );
};

export const business_service = Object.freeze({
  create,
  update,
  delete_business,
  block_shop,
  approve_shop,
  get_all,
});
