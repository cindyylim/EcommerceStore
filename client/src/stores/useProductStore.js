import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useProductStore = create((set, get) => ({
  loading: false,
  products: [],
  fetchProductsByCategory: async (category) => {
    set({loading: true});
    try {
        const response = await axios.get(`/products/category/${category}`);
        set({products: response.data.products, loading: false});
    } catch (error) {
        set({error: "Failed to get products", loading: false});
        toast.error(error.response.data.error || "Failed to get products"); 
    }
  },
}));
