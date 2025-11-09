

import { model, Schema } from "mongoose";
import { ISize, IVariant } from "./variants_types";


const variants_schema = new Schema<IVariant>({
    img: {
        type: [String],
        required: [true, "Image is required"],
    },
    color: {
        type: String,
        default: null,
    },
    size: {
        type: String,
        default: ISize.SMALL,
        enum: Object.values(ISize),
    },
    quantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: [true, "Product is required"],
    },
    discount: {
        type: Number,
        min: [0, "Discount cannot be less than 0"],
        max: [99, "Discount cannot be greater than 100"],
        default: 0,
    },
}, { timestamps: true });

variants_schema.index({ product: 1, size: 1 }, { unique: true })

variants_schema.pre('save', async function (next) {
    if (this.quantity) {
        this.quantity = Number(this.quantity)
    }
    if (this.price) {
        this.price = Number(this.price)
    }
    if (this.discount) {
        this.discount = Number(this.discount)
    }
    next()
})

export const variants_model = model<IVariant>("variants", variants_schema);


