import Aggregator from '../../utils/Aggregator';
import { QueryKeys, SearchKeys } from "../../utils/Queries";
import auth_model from "../Auth/auth_model";
import { variants_model } from "../variants/variants_model";
import { cart_model } from "./cart_model";
import { ICart, } from "./cart_type";

const create_or_update = async (data: any) => {
  const exist_cart = await cart_model.findOne({ user: data?.user, variant: data?.variant });
  const variant = await variants_model.findById(data?.variant);
  if (exist_cart) {
    await cart_model.findByIdAndUpdate(exist_cart._id, {
      quantity: data?.quantity,
    }, { new: true });
    return {
      success: true,
      message: "cart updated successfully",
      data: exist_cart,
    };
  }
  const created_cart = await cart_model.create(data)
  return {
    success: true,
    message: "cart created successfully",
    data: created_cart,
  };
}

const get_all = async (
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?: string | string[],
  selectFields?: string | string[],
) => {
  return await Aggregator(
    cart_model,
    queryKeys,
    searchKeys, [
    {
      $lookup: {
        from: "variants",
        localField: "variant",
        foreignField: "_id",
        as: "variant",
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$variant",
    },
    {
      $unwind: "$product",
    },
    {
      $addFields: {
        total_price: {
          $multiply: ["$variant.price", "$quantity"],
        },
      }
    },
    {
      $addFields: {
        price_after_discount: {
          $ifNull: ["$variant.price_after_discount", "$variant.price"]
        }
      }
    },
    {
      $project: {
        variant: {
          _id: 1,
          name: 1,
          price: 1,
          img: 1,
        },
        product: {
          _id: 1,
          name: 1,
          video: 1,
        },
        quantity: 1,
        total_price: 1,
      },
    }
  ]
  )

};

const update = async (id: string, data: ICart) => {
  const exist_cart = await cart_model.findById(id);
  if (!exist_cart) throw new Error("Cart not found");
  const updated_cart = await cart_model.findByIdAndUpdate(id, {
    quantity: data.quantity,
  }, {
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

const delete_cart_item = async (variant_id: string, user_id: string) => {
  const exist_user = auth_model.findOne({ _id: user_id });
  if (!exist_user) throw new Error("User not found");

  const exist_variant = variants_model.findOne({ _id: variant_id });
  if (!exist_variant) throw new Error("Variant not found");

  const deletedCart = await cart_model.findOneAndDelete({ _id: variant_id, user: user_id });

  if (!deletedCart) throw new Error("Something went wrong while deleting the item");

  return {
    success: true,
    message: "Item deleted successfully",
    data: deletedCart,
  };
};

export const cart_service = Object.freeze({
  create_or_update,
  get_all,
  update,
  delete_cart,
  delete_cart_item,
});
