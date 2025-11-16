import { Document, Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  total_amount: number;
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  payment_method?:
  | "credit_card"
  | "paypal"
  | "bank_transfer"
  | "cash_on_delivery";
  delivery_status?:
  | "pending"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "canceled"
  | "returned";
  delivery_address: Types.ObjectId;
  pick_up_address: Types.ObjectId;
  estimated_delivery_date?: Date;
  delivered_at?: Date;
  canceled_at?: Date;
  notes?: string;
}
