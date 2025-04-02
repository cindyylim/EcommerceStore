import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const updateProductStock = async (
  products,
  sessionId,
  mongooseSession
) => {
  const bulkOps = products.map((item) => {
    const updateOperation = {
      updateOne: {
        filter: { _id: item._id },
        update: [], // Aggregation Pipeline
        options: { runValidators: true },
      },
    };

    // --- SIZED PRODUCT LOGIC ---
    if (item.selectedSize) {
      updateOperation.updateOne.update = [
        {
          $set: {
            sizes: {
              $map: {
                input: "$sizes",
                as: "size",
                in: {
                  $mergeObjects: [
                    "$$size",
                    {
                      $cond: {
                        if: { $eq: ["$$size.size", item.selectedSize] },
                        then: {
                          // 1. DEDUCT SOLD QUANTITY (from available stock)
                          quantity: {
                            $subtract: ["$$size.quantity", item.quantity],
                          },
                          // 2. DEDUCT RESERVED QUANTITY
                          reserved: {
                            $subtract: ["$$size.reserved", item.quantity],
                          },
                          inStock: {
                            $gt: [
                              { $subtract: ["$$size.quantity", item.quantity] },
                              0,
                            ],
                          },
                          // 3. REMOVE RESERVATION OBJECT (rebuild array without it)
                          reservations: {
                            $filter: {
                              input: "$$size.reservations",
                              as: "res",
                              // Keep reservation objects where cartSessionId DOES NOT match
                              cond: { $ne: ["$$res.cartSessionId", sessionId] },
                            },
                          },
                        },
                        else: {}, // Keep other sizes as is
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // 2. Calculate new total quantity and the root flags
        {
          $set: {
            // Calculate the total product quantity (sum of all available stock sizes)
            quantity: { $sum: "$sizes.quantity" },
            // Calculate the total reserved count (sum of all reserved sizes)
            reserved: { $sum: [$ifNull[("$sizes.reserved", 0)]] },
            // Check if ANY size variant has quantity > 0
            inStock: { $gt: [{ $sum: "$sizes.quantity" }, 0] },
          },
        },
      ];

      // Filter: Ensure stock (available quantity) is sufficient and a reservation exists for this session
      updateOperation.updateOne.filter["sizes"] = {
        $elemMatch: {
          size: item.selectedSize,
          quantity: { $gte: item.quantity },
          reservations: {
            $elemMatch: { cartSessionId: sessionId, quantity: item.quantity },
          }, // Ensure correct reservation exists
        },
      };
    }
    // --- NON-SIZED PRODUCT LOGIC ---
    else {
      updateOperation.updateOne.update = [
        {
          $set: {
            // Deduct sold quantity from overall quantity (available stock)
            quantity: { $subtract: ["$quantity", item.quantity] },
            // Deduct sold quantity from overall reserved count
            reserved: { $subtract: ["$reserved", item.quantity] },
            // Remove reservation object
            reservations: {
              $filter: {
                input: "$reservations",
                as: "res",
                cond: { $ne: ["$$res.cartSessionId", sessionId] },
              },
            },
          },
        },
        {
          $set: {
            // Check if the overall quantity is greater than 0 after the reduction
            inStock: { $gt: ["$quantity", 0] },
          },
        },
      ];

      // Add a check to ensure stock is sufficient and a reservation exists
      updateOperation.updateOne.filter = {
        _id: item._id,
        quantity: { $gte: item.quantity },
        reservations: {
          $elemMatch: { cartSessionId: sessionId, quantity: item.quantity },
        }, // Ensure correct reservation exists
      };
    }

    return updateOperation;
  });

  const bulkResult = await Product.bulkWrite(bulkOps, {
    session: mongooseSession,
  });

  console.log(
    `✅ Bulk write successful! Modified ${bulkResult.modifiedCount} documents.`
  );
};

export const reserveProducts = async (products, sessionId) => {
  const currentDate = new Date();
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();
  const bulkOps = products.map((item) => {
    const updateOperation = {
      updateOne: {
        filter: { _id: item._id },
        update: {},
        options: { runValidators: true },
      },
    };
    if (item.selectedSize) {
      // --- SIZED PRODUCT LOGIC ---

      updateOperation.updateOne.update = [
        {
          $set: {
            sizes: {
              $map: {
                input: "$sizes",
                as: "size",
                in: {
                  $mergeObjects: [
                    "$$size",
                    {
                      $cond: {
                        if: {
                          $and: [
                            { $eq: ["$$size.size", item.selectedSize] },
                            // Check: available stock (quantity - reserved) >= item.quantity
                            {
                              $gte: [
                                {
                                  $subtract: [
                                    "$$size.quantity",
                                    { $ifNull: ["$$size.reserved", 0] },
                                  ],
                                },
                                item.quantity,
                              ],
                            },
                          ],
                        },
                        then: {
                          reserved: {
                            $add: [
                              { $ifNull: ["$$size.reserved", 0] },
                              item.quantity,
                            ],
                          },
                          reservations: {
                            $concatArrays: [
                              // FIX: Use $ifNull to default to [] if 'reservations' is null/missing
                              { $ifNull: ["$$size.reservations", []] },
                              [
                                {
                                  cartSessionId: sessionId,
                                  quantity: item.quantity,
                                  reservedAt: currentDate,
                                },
                              ],
                            ],
                          },
                        },
                        else: "$$size",
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $set: {
            reserved: { $sum: [$ifNull[("$sizes.reserved", 0)]] },
          },
        },
      ];

      // For sized products, we need to check if the specific size has enough available stock
      // We need to check if (quantity - reserved) >= item.quantity
      updateOperation.updateOne.filter = {
        _id: item._id,
        $expr: {
          $gte: [
            {
              $subtract: [
                {
                  $let: {
                    vars: {
                      sizeObj: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$sizes",
                              cond: { $eq: ["$$this.size", item.selectedSize] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$sizeObj.quantity",
                  },
                },
                {
                  $let: {
                    vars: {
                      sizeObj: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$sizes",
                              cond: { $eq: ["$$this.size", item.selectedSize] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$sizeObj.reserved", 0] },
                  },
                },
              ],
            },
            item.quantity,
          ],
        },
      };
    }
    // --- NON-SIZED PRODUCT LOGIC ---
    else {
      updateOperation.updateOne.update = [
        {
          $set: {
            // Only update if there's enough available stock
            reserved: {
              $cond: {
                if: {
                  $gte: [
                    { $subtract: ["$quantity", { $ifNull: ["$reserved", 0] }] },
                    item.quantity,
                  ],
                },
                then: { $add: [{ $ifNull: ["$reserved", 0] }, item.quantity] },
                else: "$reserved",
              },
            },
            reservations: {
              $cond: {
                if: {
                  $gte: [
                    { $subtract: ["$quantity", { $ifNull: ["$reserved", 0] }] },
                    item.quantity,
                  ],
                },
                then: {
                  $concatArrays: [
                    // FIX: Use $ifNull to default to [] if 'reservations' is null/missing
                    { $ifNull: ["$reservations", []] },
                    [
                      {
                        cartSessionId: sessionId,
                        quantity: item.quantity,
                        reservedAt: currentDate,
                      },
                    ],
                  ],
                },
                else: "$reservations",
              },
            },
          },
        },
      ];

      // Add filter to ensure stock is sufficient before attempting update
      // Check if available stock (quantity - reserved) is >= item.quantity
      updateOperation.updateOne.filter = {
        _id: item._id,
        $expr: {
          $gte: [
            { $subtract: ["$quantity", { $ifNull: ["$reserved", 0] }] },
            item.quantity,
          ],
        },
      };
    }

    return updateOperation;
  });

  // Execute the bulk write
  const bulkResult = await Product.bulkWrite(bulkOps, {
    session: mongooseSession,
  });

  try {
    // Check if all products were successfully reserved before committing
    if (bulkResult.modifiedCount !== products.length) {
      throw new Error(
        "Some products could not be reserved due to insufficient stock."
      );
    }
    await mongooseSession.commitTransaction();
    console.log(
      `✅ Bulk write successful! Modified ${bulkResult.modifiedCount} documents.`
    );
    return bulkResult;
  } catch (error) {
    await mongooseSession.abortTransaction();
    console.error("❌ Transaction failed and rolled back:", error);
    throw error;
  } finally {
    mongooseSession.endSession();
  }
};
