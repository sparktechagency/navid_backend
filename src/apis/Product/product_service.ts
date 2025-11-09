import { Request } from "express";
import { Types } from "mongoose";
import Aggregator from "../../utils/Aggregator";
import { QueryKeys, SearchKeys } from "../../utils/Queries";
import { product_model } from "./product_model";
import IProduct from "./product_type";

const create = async (body: IProduct) => {
  await product_model.create(body);
  return {
    success: true,
    message: "product created successfully",
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
      $lookup: {
        from: "services",
        foreignField: "_id",
        localField: "sub_category",
        as: "sub_categories",
      },
    },
    {
      $lookup: {
        from: "variants",
        foreignField: "product",
        localField: "_id",
        as: "variants",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$sub_categories",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        whole_sale: 1,
        name: 1,
        description: 1,
        banner: 1,
        quantity: 1,
        sub_category: 1,
        "category.name": 1,
        "category.img": 1,
        "sub_categories.name": 1,
        "sub_categories.img": 1,
        img: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: "$variants",
                    as: "variant",
                    cond: {
                      $or: [
                        { $eq: ["$$variant.is_deleted", false] },
                        { $not: ["$$variant.is_deleted"] }
                      ]
                    }
                  }
                },
                as: "variant",
                in: { $first: "$$variant.img" }
              }
            },
            0
          ]
        },
        price: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: "$variants",
                    as: "variant",
                    cond: {
                      $or: [
                        { $eq: ["$$variant.is_deleted", false] },
                        { $not: ["$$variant.is_deleted"] }
                      ]
                    }
                  }
                },
                as: "variant",
                in: "$$variant.price"
              }
            },
            0
          ]
        },
        discount: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: "$variants",
                    as: "variant",
                    cond: {
                      $or: [
                        { $eq: ["$$variant.is_deleted", false] },
                        { $not: ["$$variant.is_deleted"] }
                      ]
                    }
                  }
                },
                as: "variant",
                in: "$$variant.discount"
              }
            },
            0
          ]
        },
        colors: {
          $map: {
            input: {
              $filter: {
                input: "$variants",
                as: "variant",
                cond: {
                  $or: [
                    { $eq: ["$$variant.is_deleted", false] },
                    { $not: ["$$variant.is_deleted"] }
                  ]
                }
              }
            },
            as: "variant",
            in: "$$variant.color"
          }
        },
        size: {
          $map: {
            input: {
              $filter: {
                input: "$variants",
                as: "variant",
                cond: {
                  $or: [
                    { $eq: ["$$variant.is_deleted", false] },
                    { $not: ["$$variant.is_deleted"] }
                  ]
                }
              }
            },
            as: "variant",
            in: "$$variant.size"
          }
        }
      }
    },
    {
      $addFields: {
        price_after_discount: {
          $let: {
            vars: {
              price: "$price",
              discount: "$discount"
            },
            in: {
              $cond: {
                if: { $gt: ["$$discount", 0] },
                then: {
                  $subtract: [
                    "$$price",
                    { $divide: [{ $multiply: ["$$price", "$$discount"] }, 100] }
                  ]
                },
                else: "$$price"
              }
            }
          }
        },
      },
    }
  ],);
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
      $lookup: {
        from: "variants",
        foreignField: "product",
        localField: "_id",
        as: "variants",
      },
    },
    {
      $unwind: {
        path: "$sub_category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        whole_sale: 1,
        "category.name": 1,
        "category.img": 1,
        "category._id": 1,
        "sub_category.name": 1,
        "sub_category.img": 1,
        "sub_category._id": 1,
        // img: { $arrayElemAt: [{ $ifNull: ["$variants.img", []] }, 0] },
        // price: { $arrayElemAt: [{ $ifNull: ["$variants.price", []] }, 0] },
        // discount: { $arrayElemAt: [{ $ifNull: ["$variants.discount", []] }, 0] },
        // price_after_discount: {
        //   $cond: {
        //     if: { $gt: [{ $arrayElemAt: [{ $ifNull: ["$variants.discount", []] }, 0] }, 0] },
        //     then: {
        //       $subtract: [
        //         { $arrayElemAt: [{ $ifNull: ["$variants.price", []] }, 0] },
        //         {
        //           $divide: [
        //             {
        //               $multiply: [
        //                 { $arrayElemAt: [{ $ifNull: ["$variants.price", []] }, 0] },
        //                 { $arrayElemAt: [{ $ifNull: ["$variants.discount", []] }, 0] }
        //               ]
        //             },
        //             100
        //           ]
        //         }
        //       ]
        //     },
        //     else: { $arrayElemAt: [{ $ifNull: ["$variants.price", []] }, 0] }
        //   }
        // },
        variants: {
          $map: {
            input: {
              $filter: {
                input: "$variants",
                as: "variant",
                cond: {
                  $or: [
                    { $eq: ["$$variant.is_deleted", false] },
                    { $not: ["$$variant.is_deleted"] }
                  ]
                }
              }
            },
            as: "variant",
            in: {
              _id: "$$variant._id",
              img: "$$variant.img",
              color: "$$variant.color",
              size: "$$variant.size",
              quantity: "$$variant.quantity",
              price: "$$variant.price",
              discount: "$$variant.discount",
              product: "$$variant.product",
              price_after_discount: {
                $cond: {
                  if: { $gt: ["$$variant.discount", 0] },
                  then: {
                    $round: [
                      {
                        $subtract: [
                          "$$variant.price",
                          {
                            $divide: [
                              { $multiply: ["$$variant.price", "$$variant.discount"] },
                              100
                            ]
                          }
                        ]
                      },
                      2
                    ]
                  },
                  else: "$$variant.price"
                }
              }
            }
          }
        },
      },
    },
  ]);
  //  colors: {
  //           $map: {
  //             input: "$variants",
  //             as: "variant",
  //             in: "$$variant.color"
  //           }
  //         },
  //         size: {
  //           $map: {
  //             input: "$variants",
  //             as: "variant",
  //             in: "$$variant.size"
  //           }
  //         }
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
        quantity: variant.quantity,
        size: variant.size,
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
});
