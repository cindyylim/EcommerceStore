import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  loading: false,
  addToCart: async (product) => {
    set({ loading: true });
    try {
      await axios.post("/api/cart", { product_id: product._id });
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
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to create cart");
    }
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
    set({ loading: true });
    try {
      const response = await axios.get("/api/cart");
      set({ cart: response.data, loading: false });
      get().calculateTotals();
    } catch (error) {
      set({ error: "Failed to get cart", loading: false });
      toast.error(error.response.data.error || "Failed to get cart");
    }
  },
  deleteCart: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/cart/${id}`);
      set((prevState) => ({
        cart: prevState.cart.filter((cart) => cart._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to delete cart");
    }
  },
}));
