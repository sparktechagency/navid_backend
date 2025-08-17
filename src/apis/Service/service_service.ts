import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { service_model } from "./service_model";

async function create(data: { [key: string]: string }) {
  const result = await service_model.insertMany(data);
  return {
    success: true,
    message: "service created successfully",
    data: result,
  };
}

async function update(id: string, data: { [key: string]: string }) {
  const result = await service_model.findByIdAndUpdate(
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
    message: "service updated successfully",
    data: result,
  };
}

async function delete_service(id: string) {
  const result = await service_model.findByIdAndDelete(id);

  return {
    success: true,
    message: "service deleted successfully",
    data: result,
  };
}

async function get_all(
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?:
    | string
    | [
      | string
      | {
        [key: string]:
        | string
        | { [key: string]: string | { [key: string]: string } };
      },
    ],
  selectFields?: string | string[],
  modelSelect?: string,
) {
  return await Queries(
    service_model,
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
    modelSelect,
  );
}

export const service_service = Object.freeze({
  create,
  get_all,
  update,
  delete_service,
});
