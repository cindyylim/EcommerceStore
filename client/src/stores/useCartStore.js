import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,
  addToCart: async (product) => {
    try {
      await axios.post("/api/cart", { productId: product._id });
      toast.success("Product added to cart");

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart, loading: false };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.error || "Failed to create cart");
    }
  },
  removeFromCart: async (productId) => {
    await axios.delete("/api/cart", { data: { productId } });
    set((prevState) => ({
      cart: prevState.cart.filter((item) => item._id !== productId),
    }));
    get().calculateTotals();
  },
  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let total = subtotal;

    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
  getCartItems: async () => {
    try {
      const response = await axios.get("/api/cart");
      set({ cart: response.data });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.error || "Failed to get cart");
    }
  },
  deleteCart: async (id) => {
    try {
      await axios.delete(`/api/cart/${id}`);
      set((prevState) => ({
        cart: prevState.cart.filter((cart) => cart._id !== id),
      }));
    } catch (error) {
      toast.error(error.response.data.error || "Failed to delete cart");
    }
  },
  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }
    try {
      await axios.put(`/api/cart/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) => {
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
