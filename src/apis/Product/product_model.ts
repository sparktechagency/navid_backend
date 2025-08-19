import { Schema, model } from "mongoose";
import IProduct, { ISize, IVariant } from "./product_type";

const variants_schema = new Schema<IVariant>(
  {
    img: {
      type: [String],
      required: [true, "image is missing for some variants"],
    },
    color: {
      type: String,
      default: "no_variants",
    },
    size: {
      type: [String],
      default: [ISize.SMALL],
      enum: Object.values(ISize),
    },
    quantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    }
  },
  { _id: false },
);

const product_schema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product Name is required"],
      unique: true,
    },
    description: { type: String, required: [true, "Description is required"] },
    price: { type: Number, required: [true, "Price is required"] },
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
    quantity: {
      type: Number,
      default: 0,
    },
    variants: {
      type: [variants_schema],
      required: [true, "image is required"],
    },
    previous_price: {
      type: Number,
      default: 0,
      required: [true, "discount price is required"],
    },
  },
  { timestamps: true },
);
product_schema.pre("save", function (next) {
  if (Number(this.price) < Number(this.previous_price)) {
    throw new Error("Discount price cannot be greater than the original price");
  }
  this.price = Number(this.price) - Number(this.previous_price);
  this.previous_price = Number(this.price) + Number(this.previous_price);
  next();
})

export const product_model = model<IProduct>("product", product_schema);
