import { Document, Types } from "mongoose";

export interface IPayment extends Document {
  session_id: string;
  transaction_id: string;
  order: Types.ObjectId;
  status: boolean;
  user: Types.ObjectId;
  amount: number;
  refund: string;
  currency: string;
}
