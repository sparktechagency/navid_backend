import { Document, Types } from "mongoose";


export interface ICart extends Document {
  user: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
  variant: Types.ObjectId;
}
