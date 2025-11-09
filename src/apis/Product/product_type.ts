import { Document, Types } from "mongoose";


interface IProduct extends Document {
  name: string;
  description: string;
  category: Types.ObjectId;
  sub_category: Types.ObjectId;
  user: Types.ObjectId;
  whole_sale: boolean;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean;
}

export default IProduct;
