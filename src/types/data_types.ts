export interface IPaymentData extends Document {
  name: string;
  unit_amount: Number;
  _id: string;
  quantity: Number; //////
  // one:string
}
