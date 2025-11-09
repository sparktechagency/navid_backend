import { model, Schema } from "mongoose";
import { ICart } from "./cart_type";


const cart_schema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "auth",
    required: [true, "User ID is required"],
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: "product",
    required: [true, "Product ID is required"],
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
    default: 1,
  },
});

cart_schema.index({ user: 1, "product_id": 1 ,"variant": 1}, { unique: true });

// cart_schema.pre("save", function (next) {
//   this.total_quantity = this.items.reduce(
//     (acc, item) => acc + item.quantity,
//     0,
//   );
//   this.total_price = this.items.reduce(
//     (acc, item) => acc + item.quantity * item.price, //item.quantity *
//     0,
//   );

//   next();
// });

export const cart_model = model<ICart>("cart", cart_schema);
