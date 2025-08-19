import { Document, Types } from "mongoose";
export enum ISize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  "30MM" = "30MM",
  "40MM" = "40MM",
  "50gram" = "50gram",
  "200gram" = "200gram",
  "250gram" = "250gram",
  "1000gram" = "1000gram",
  "2gram" = "2gram",
  "1gram" = "1gram",
  "3.5gram" = "3.5gram",
  "4.5gram" = "4.5gram",
  "5gram" = "5gram"
}
export interface IVariant {
  img: string[];
  color: string;
  size: [ISize];
  quantity: number;
  price: number;
}

interface IProduct extends Document {
  name: string;
  description: string;
  price: Number;
  variants: IVariant[];
  category: Types.ObjectId;
  sub_category: Types.ObjectId;
  user: Types.ObjectId;
  whole_sale: boolean;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
  previous_price: Number;
}

export default IProduct;
