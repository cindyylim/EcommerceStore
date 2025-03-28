import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useShoppingBagStore = create((set, get) => ({
  shoppingBag: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,
  getMyCoupon: async () => {
    try {
      const response = await axios.get("/api/coupons");
      set({coupon: response.data});
    }catch (error) {
      toast.error(error.response.data.error || "Failed to get coupon");
    }
  },
  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/api/coupons/validate", {code});
      set({coupon: response.data, isCouponApplied: true});
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    }catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },
  removeCoupon: () => {
    set({coupon: null, isCouponApplied: false});
    get().calculateTotals();
    toast.success("Coupon removed");
  },
  addToShoppingBag: async (productId) => {
    try {
      const response = await axios.post("/api/shoppingBag", { productId });
      set({ shoppingBag: response.data });
      toast.success("Product added to shopping bag");
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to shopping bag");
    }
  },
  removeFromShoppingBag: async (productId) => {
    try {
      const response = await axios.delete("/api/shoppingBag", { data: { productId } });
      set({ shoppingBag: response.data });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove from shopping bag");
    }
  },
  clearShoppingBag: async () => {
    try {
      const response = await axios.delete("/api/shoppingBag", { data: { productId: null } });
      set({ shoppingBag: response.data, coupon: null, total: 0, subtotal: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear shopping bag");
    }
  },
  calculateTotals: () => {
    const { shoppingBag, coupon } = get();
    const subtotal = shoppingBag.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    let total = subtotal;

    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
  getShoppingBagItems: async () => {
    try {
      const response = await axios.get("/api/shoppingBag");
      set({ shoppingBag: response.data });
      get().calculateTotals();
    } catch (error) {
      console.error("Failed to get shopping bag:", error);
      toast.error("Failed to get shopping bag");
    }
  },
  updateQuantity: async (productId, quantity) => {
    try {
      const response = await axios.put(`/api/shoppingBag/${productId}`, { quantity });
      set({ shoppingBag: response.data });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  },
}));
