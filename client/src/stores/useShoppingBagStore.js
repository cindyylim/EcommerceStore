import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useShoppingBagStore = create((set, get) => ({
  ShoppingBag: [],
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
  addToShoppingBag: async (product) => {
    try {
      await axios.post("/api/ShoppingBag", { productId: product._id });
      toast.success("Product added to ShoppingBag");

      set((prevState) => {
        const existingItem = prevState.ShoppingBag.find(
          (item) => item._id === product._id
        );
        const newShoppingBag = existingItem
          ? prevState.ShoppingBag.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prevState.ShoppingBag, { ...product, quantity: 1 }];
        return { ShoppingBag: newShoppingBag, loading: false };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.error || "Failed to create shopping bag");
    }
  },
  removeFromShoppingBag: async (productId) => {
    await axios.delete("/api/ShoppingBag", { data: { productId } });
    set((prevState) => ({
      ShoppingBag: prevState.ShoppingBag.filter((item) => item._id !== productId),
    }));
    get().calculateTotals();
  },
  clearShoppingBag: async () => {
		set({ ShoppingBag: [], coupon: null, total: 0, subtotal: 0 });
	},
  calculateTotals: () => {
    const { ShoppingBag, coupon } = get();
    const subtotal = ShoppingBag.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    let total = subtotal;

    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      console.log(discount);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
  getShoppingBagItems: async () => {
    try {
      const response = await axios.get("/api/ShoppingBag");
      set({ ShoppingBag: response.data });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.error || "Failed to get ShoppingBag");
    }
  },
  deleteShoppingBag: async (id) => {
    try {
      await axios.delete(`/api/ShoppingBag/${id}`);
      set((prevState) => ({
        ShoppingBag: prevState.ShoppingBag.filter((ShoppingBag) => ShoppingBag._id !== id),
      }));
    } catch (error) {
      toast.error(error.response.data.error || "Failed to delete ShoppingBag");
    }
  },
  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromShoppingBag(productId);
      return;
    }
    try {
      await axios.put(`/api/ShoppingBag/${productId}`, { quantity });
      set((prevState) => ({
        ShoppingBag: prevState.ShoppingBag.map((item) => {
          if (item._id === productId) {
            return { ...item, quantity };
          }
          return item;
        }),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.error || "Failed to update quantity");
    }
  },
}));
