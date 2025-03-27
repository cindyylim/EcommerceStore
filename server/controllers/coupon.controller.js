import Coupon from "../models/coupon.model.js";
import mongoose from "mongoose";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: new mongoose.Types.ObjectId(req.user._id),
      isActive: true,
    });
    return res.status(200).json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({
      code: code,
      userId: new mongoose.Types.ObjectId(req.user._id),
      isActive: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }
    return res
      .status(200)
      .json({
        messsage: "Coupon is valid",
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      });
  } catch (error) {
    console.log("Error in validateCoupon controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};
