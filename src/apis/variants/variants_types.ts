import { Types, Document } from "mongoose";

export enum ISize {
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
    "33MM" = "33MM",
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
export interface IVariant extends Document {
    img: string[];
    color: string;
    size: ISize;
    quantity: number;
    price: number;
    discount: number;
    product: Types.ObjectId;
    is_deleted: boolean,
    price_after_discount: number
}


