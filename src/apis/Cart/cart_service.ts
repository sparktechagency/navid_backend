import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { cart_model } from "./cart_model";
import { ICart, ICartItem } from "./cart_type";

const create_or_update = async (user_id: string, items: ICartItem[]) => {
  let total_quantity = 0;
  let total_price = 0;

  let cart = await cart_model.findOne({ user: user_id });

  if (cart) {
    for (const new_item of items) {
      const existing_item_index = cart.items.findIndex(
        (item) => item.product_id.toString() === new_item.product_id.toString(),
      );

      if (existing_item_index >= 0) {
        cart.items[existing_item_index].price = new_item.price;

        if (
          Number(cart.items[existing_item_index].quantity) <
          Number(new_item.quantity)
        ) {
          const increase =
            new_item.quantity - cart.items[existing_item_index].quantity;

          cart.items[existing_item_index].quantity += increase;
        } else if (
          Number(cart.items[existing_item_index].quantity) >
          Number(new_item.quantity)
        ) {
          const decrease =
            cart.items[existing_item_index].quantity - new_item.quantity;
          cart.items[existing_item_index].quantity -= decrease;
        }
      } else {
        cart.items.push(new_item);
      }
    }
    cart?.items?.forEach((item) => {
      if (item.quantity <= 0)
        throw new Error(`Quantity cannot be negative or 0`);
      total_quantity += item.quantity;
      total_price += item.quantity * item.price;
    });
    cart.total_quantity = total_quantity;
    cart.total_price = total_price;
    // console.log(cart.items);
    // cart.total_quantity = cart.items.reduce(
    //   (acc, item) => acc + item.quantity,
    //   0,
    // );
    // cart.total_price = cart.items.reduce(
    //   (acc, item) => {
    //     return acc + item.price
    //     //item.quantity
    //   },
    //   0,
    // );

    await cart.save();
    return {
      success: true,
      message: "new item added to cart",
      data: cart,
    };
  } else {
    items.forEach((item) => {
      if (item.quantity <= 0)
        throw new Error(`Quantity cannot be negative or 0`);

      total_quantity += item.quantity;
      total_price += item.quantity * item.price;
    });
    cart = await cart_model.create({
      user: user_id,
      items,
      total_quantity,
      total_price,
    });
    return {
      success: true,
      message: "cart created successfully",
      data: cart,
    };
  }
};

const get_all = async (
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?: string | string[],
  selectFields?: string | string[],
  order?: string,
) => {
  const carts = (await Queries(
    cart_model,
    queryKeys,
    searchKeys,
    populatePath,
    selectFields,
  )) as {
    success: boolean;
    data: [{ items: ICartItem[] }];
  };
  const filter_null = carts?.data?.[0]?.items?.filter((item: ICartItem) =>
    item?.product_id !== null,
  );
  if (carts.data?.length<=0) {
    return {
      success: true,
      data: [],
    };
  }
  carts.data[0].items = filter_null;
  if (order) {
    const order_ids = order.split(",");

    const new_item = carts?.data?.[0]?.items?.filter((item: ICartItem) =>
      order_ids.includes(item?.product_id?._id?.toString()),
    );

    const formateData = {
      success: true,
      data: [{ items: new_item }],
    };

    return formateData;
  } else {

    return {
      success: true,
      data: carts?.data?.[0] || null,
    };
  }
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
  let cart = await cart_model.findOne({ user: user_id });

  if (!cart) throw new Error("Cart not found");

  const targeted_item = cart.items?.find(
    (item) => item?.product_id?.toString() == id,
  );

  const newItems = cart.items?.filter(
    (item) => item?.product_id?.toString() != id,
  );

  if (!targeted_item) throw new Error("Item not found");

  cart.items = newItems;
  let total_quantity = 0;
  let total_price = 0;

  cart?.items?.forEach((item) => {
    if (item.quantity <= 0) throw new Error(`Quantity cannot be negative or 0`);
    total_quantity += item.quantity;
    total_price += item.quantity * item.price;
  });

  cart.total_quantity = total_quantity;
  cart.total_price = total_price;
  await cart.save();

  return {
    success: true,
    message: "Item deleted successfully",
    data: cart,
  };
};

export const cart_service = Object.freeze({
  create_or_update,
  get_all,
  update,
  delete_cart,
  delete_cart_item,
});
