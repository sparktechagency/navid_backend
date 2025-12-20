import mongoose from "mongoose";
import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { cart_model } from '../Cart/cart_model';
import { notification_model } from "../Notifications/notification_model";
import { variants_model } from '../variants/variants_model';
import { order_model } from "./order_model";
import { IOrder, IOrderItem } from "./order_type";

const create_order = async (data: any, user_id: string) => {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const {
        items,
        delivery_address,
        pick_up_address,
        totalAmount
      } = data;

      const order_data = {
        user: user_id,
        items,
        delivery_address,
        pick_up_address,
        total_amount: totalAmount,
      };
      const orderPromise = order_model.insertMany([order_data], { session });

      const notificationPromise = notification_model.insertMany(
        [
          {
            user: user_id,
            title: "Order Confirmed",
            message: `Your order has been confirmed. Please make payment.`,
          },
        ],
        { session }
      );

      const variantUpdate = items.map((item: IOrderItem) => {
        return variants_model.updateOne(
          { _id: item.product },
          { $inc: { quantity: -item.quantity } },
          { session }
        );
      });

      const Product_ids = items.map((item: IOrderItem) => item.product);

      const cartUpdate = cart_model.deleteMany(
        { user: user_id, product_id: { $in: Product_ids } },
        { session }
      );

      await Promise.all([
        orderPromise,
        notificationPromise,
        variantUpdate,
        cartUpdate,
      ]);

      return {
        success: true,
        message: "Order created successfully",
      };
    });
    return result;
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }
};


const get_all = async (
  queryKeys: QueryKeys,
  searchKeys: SearchKeys,
  populatePath?: any,
  selectFields?: string | string[],
  modelSelect?: string,
) => {
  return await Queries(
    order_model,
    queryKeys,
    searchKeys,
    populatePath,     
    selectFields,
    modelSelect,
  );
};

const get_order_details = async (id: string) => {
  const order_details = await order_model
    .findById(id)
    .populate({
      path: "user",
      select: "name email img",
    })
    .populate({
      path: "items.product",
      select: "name video whole_sale",
    })
    .populate({
      path: "items.variant",
      select: "name price img price_after_discount discount quantity color size",
    })
    .populate({
      path: "delivery_address",
      select: "name phone address",
    });
  return {
    success: true,
    message: "order data retrieved successfully",
    data: order_details,
  };
};

const update_order = async (id: string, data: IOrder) => {
  const { estimated_delivery_date, delivered_at, canceled_at } = data;
  if (
    (estimated_delivery_date &&
      new Date(estimated_delivery_date?.toString() as string) < new Date()) ||
    (delivered_at &&
      new Date(delivered_at?.toString() as string) < new Date()) ||
    (canceled_at && new Date(canceled_at?.toString() as string) < new Date())
  ) {
    throw new Error("invalid date ");
  }
  const updated_order = await order_model.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!updated_order) throw new Error("Order not found");

  return {
    success: true,
    message: "Order updated successfully",
    data: updated_order,
  };
};

const delete_order = async (id: string) => {
  const deleted_order = await order_model.findByIdAndDelete(id);

  if (!deleted_order) throw new Error("Order not found");

  return {
    success: true,
    message: "Order deleted successfully",
    data: deleted_order,
  };
};

const update_delivery_status = async (id: string, delivery_status: string) => {
  const updated_order = await order_model.findByIdAndUpdate(
    id,
    { delivery_status },
    { new: true },
  );

  if (!updated_order) throw new Error("Order not found");

  return {
    success: true,
    message: "Order updated successfully",
    data: updated_order,
  };
};

export const order_service = Object.freeze({
  create_order,
  get_all,
  get_order_details,
  update_order,
  delete_order,
  update_delivery_status,
});
