import { Document, Types } from "mongoose";

export interface ICartItem {
  product_id: Types.ObjectId;
  quantity: number;
  variant: string;
  price: number;
  size: string
  _id: Types.ObjectId;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  total_quantity: number;
  total_price: number;
}
