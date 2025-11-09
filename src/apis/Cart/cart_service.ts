import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { cart_model } from "./cart_model";
import { ICart, } from "./cart_type";

const create_or_update = async (data:any) => {


  let cart = await cart_model.findOne(data);

  return {
    success: true,
    message: "cart created successfully",
  };
}

const get_all = async (
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?: string | string[],
  selectFields?: string | string[],
  order?: string,
) => {
  return await Queries(
    cart_model,
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
  )

};

const update = async (id: string, data: ICart) => {
  const updated_cart = await cart_model.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!updated_cart) throw new Error("Cart not found");

  return {
    success: true,
    message: "Cart updated successfully",
    data: updated_cart,
  };
};

const delete_cart = async (id: string) => {
  const deletedCart = await cart_model.findByIdAndDelete(id);

  if (!deletedCart) throw new Error("Cart not found");

  return {
    success: true,
    message: "Cart deleted successfully",
    data: deletedCart,
  };
};

const delete_cart_item = async (id: string, user_id: string) => {
   cart_model.findOne({ user: user_id });

 

  return {
    success: true,
    message: "Item deleted successfully",
  };
};

export const cart_service = Object.freeze({
  create_or_update,
  get_all,
  update,
  delete_cart,
  delete_cart_item,
});
