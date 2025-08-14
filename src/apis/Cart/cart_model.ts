import { model, Schema } from "mongoose";
import { ICart, ICartItem } from "./cart_type";

const cart_item_schema = new Schema<ICartItem>({
  product_id: {
    type: Schema.Types.ObjectId,
    ref: "product",
    required: [true, "Product ID is required"],
  },
  variant: {
    type: String,
    required: [true, "variant is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  size: {
    type: String,
    required: false,
    default: null
  }
});

const cart_schema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "auth",
    required: [true, "User ID is required"],
  },
  items: {
    type: [cart_item_schema],
    default: [],
  },
  total_quantity: {
    type: Number,
    default: 0,
  },
  total_price: {
    type: Number,
    default: 0,
  },
});
cart_schema.index({ user: 1, "items.product_id": 1 }, { unique: true });

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
