import { Schema, model } from "mongoose";
import IShippingAddress from "./shipping_address_type";

const shipping_address_schema = new Schema<IShippingAddress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    address: {
      type: String,
      required: [true, "Street is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "phone number is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "name is required"],
    },
  },
  { timestamps: true },
);

export const shipping_address_model = model<IShippingAddress>(
  "shipping_address",
  shipping_address_schema,
);
