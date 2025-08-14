import { Request } from "express";
import { Types } from "mongoose";
import Aggregator from "../../utils/Aggregator";
import { QueryKeys, SearchKeys } from "../../utils/Queries";
import { product_model } from "./product_model";
import IProduct, { ISize } from "./product_type";
// interface IParameters extends IProduct {
//     deleted_images: string
//     retained_images: string
//     coupon_code: string
// }
const create = async (body: IProduct) => {
  const result = await product_model.create(body);

  return {
    success: true,
    message: "product created successfully",
    data: result,
  };
};

const get_all = async (queryKeys: QueryKeys, searchKeys: SearchKeys) => {
  return await Aggregator(product_model, queryKeys, searchKeys, [
    {
      $lookup: {
        from: "categories",
        foreignField: "_id",
        localField: "category",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        variantImages: {
          $arrayToObject: {
            $map: {
              input: "$variants",
              as: "variant",
              in: {
                k: "$$variant.color",
                v: {
                  img: "$$variant.img",
                  size: "$$variant.size",
                  quantity: "$$variant.quantity",
                },
              },
            },
          },
        },
        banner: {
          $map: {
            input: {
              $filter: {
                input: "$variants",
                as: "variant",
                cond: { $ne: ["$$variant.color", "video"] },
              },
            },
            as: "variant",
            in: { $arrayElemAt: ["$$variant.img", 0] },
          },
        },
        variantColors: {
          $map: {
            input: "$variants",
            as: "variant",
            in: "$$variant.color",
          },
        },
      },
    },
    {
      $project: {
        whole_sale: 1,
        name: 1,
        description: 1,
        price: 1,
        banner: 1,
        quantity: 1,
        sub_category: 1,
        previous_price: 1,
        variantImages: 1,
        variantColors: 1,
        "category.name": 1,
        "category.img": 1,
      },
    },
  ]);
};

const get_details = async (id: string, tax: string | null) => {
  const product = await product_model.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "categories",
        foreignField: "_id",
        localField: "category",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "services",
        foreignField: "_id",
        localField: "sub_category",
        as: "sub_category",
      },
    },
    {
      $unwind: {
        path: "$sub_category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        variantImages: {
          $arrayToObject: {
            $map: {
              input: "$variants",
              as: "variant",
              in: {
                k: "$$variant.color",
                v: {
                  img: "$$variant.img",
                  size: "$$variant.size",
                  quantity: "$$variant.quantity",
                },
              },
            },
          },
        },
        banner: {
          $map: {
            input: {
              $filter: {
                input: "$variants",
                as: "variant",
                cond: { $ne: ["$$variant.color", "video"] },
              },
            },
            as: "variant",
            in: { $arrayElemAt: ["$$variant.img", 0] },
          },
        },
        variantColors: {
          $map: {
            input: "$variants",
            as: "variant",
            in: "$$variant.color",
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        banner: 1,
        price: 1,
        quantity: 1,
        variantImages: 1,
        previous_price: 1,
        variantColors: 1,
        whole_sale: 1,
        "category.name": 1,
        "category.img": 1,
        "category._id": 1,
        "sub_category.name": 1,
        "sub_category.img": 1,
        "sub_category._id": 1,
      },
    },
  ]);

  const related_product = await get_all(
    {
      category: product?.[0]?.category?._id,
      _id: { $ne: [new Types.ObjectId(id)] },
      ...(!tax && { whole_sale: false }),
    },
    {},
  );

  return {
    success: true,
    message: "product data retrieved successfully",
    data: product?.[0] ?? null,
    related_product: related_product?.data ?? [],
  };
};

const update_product = async (id: string, body: IProduct) => {
  const result = await product_model.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...body,
      },
    },
    { new: true },
  );

  return {
    success: true,
    message: "product updated successfully",
    data: result,
  };
};

const delete_product = async (id: string) => {
  const product = await product_model.findOne({ _id: id });

  if (!product) throw new Error("Product not found");

  const result = await product_model.findOneAndDelete({ _id: id });

  return {
    success: true,
    message: "product deleted successfully",
    data: result,
  };
};

const approve_product = async (id: string) => {
  const result = await product_model.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        is_approved: true,
      },
    },
    { new: true },
  );

  return {
    success: true,
    message: "product approved successfully",
    data: result,
  };
};

const feature_product = async (id: string) => {
  const result = await product_model.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        $cond: {
          if: { $eq: ["$is_featured", false] },
          then: true,
          else: false,
        },
      },
    },
    { new: true },
  );

  return {
    success: true,
    data: result,
  };
};

const formate_variant = (req: Request) => {
  const variants =
    Array.isArray(req.files) && req.files.length > 0
      ? req.files.map((item: any) => {
        // if(!item.fieldname?.include('productImage')) return {}
        return {
          color: item?.fieldname?.split("_")?.[1],
          img: item?.path,
          quantity: req?.body?.[`quantity_${item?.fieldname?.split("_")?.[1]}`] ? parseInt(req?.body?.[`quantity_${item?.fieldname?.split("_")?.[1]}`]) : 0,
          size: req?.body?.[`size_${item?.fieldname?.split("_")?.[1]}`] ? JSON.parse(req?.body?.[`size_${item?.fieldname?.split("_")?.[1]}`]) : [ISize.SMALL],
        };
      })
      : [];

  const variants_formate = variants.reduce((acc: any[], curr) => {
    const existingVariant = acc.find((item) => item.color === curr.color);

    if (existingVariant) {
      existingVariant.img.push(curr.img);
    } else {
      acc.push({
        color: curr.color,
        img: [curr.img],
        quantity: curr.quantity,
        size: curr.size,
      });
    }

    return acc;
  }, []);

  return variants_formate;
};

const merge_variants = (variants1: any[], variants2: any[]) => {
  const mergedMap = new Map();

  [...variants1, ...variants2].forEach((variant) => {
    if (mergedMap.has(variant.color)) {
      // If color exists, merge the img array
      mergedMap.get(variant.color).img.push(...variant.img);
    } else {
      // If color does not exist, add new entry
      mergedMap.set(variant.color, {
        color: variant.color,
        img: [...variant.img],
      });
    }
  });

  return Array.from(mergedMap.values());
};

export const product_service = Object.freeze({
  create,
  get_all,
  get_details,
  update_product,
  delete_product,
  approve_product,
  feature_product,
  merge_variants,
  formate_variant,
});
