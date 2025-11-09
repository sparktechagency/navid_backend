import { Schema, model } from "mongoose";
import IProduct from "./product_type";

const product_schema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product Name is required"],
      unique: true,
    },
    description: { type: String, required: [true, "Description is required"] },
    category: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: [true, "Category is required"],
    },
    sub_category: {
      type: Schema.Types.ObjectId,
      ref: "service",
      required: [true, "Sub Category is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "auth",
      required: [true, "user is required"],
    },
    whole_sale: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);


export const product_model = model<IProduct>("product", product_schema);
