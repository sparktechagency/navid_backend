import { Schema, model } from "mongoose";
import { IOrder } from "./order_type";

const order_schema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "auth",
      required: [true, "Customer reference is required"],
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "product",
          required: [true, "Product is required"],
        },
        variant: {
          type: Schema.Types.ObjectId,
          ref: "variants",
          required: [true, "Variant is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: 1,
        },
      },
    ],
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    total_amount: {
      type: Number,
      required: [true, "Total amount is required"],
    },
    delivery_status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
    },
    delivery_address: {
      type: Schema.Types.ObjectId,
      ref: "shipping_address",
      default: null,
    },
    pick_up_address: {
      type: Schema.Types.ObjectId,
      ref: "pick_address",
      default: null,
    },
    estimated_delivery_date: {
      type: Date,
    },
    delivered_at: {
      type: Date,
    },
    canceled_at: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

export const order_model = model<IOrder>("order", order_schema);