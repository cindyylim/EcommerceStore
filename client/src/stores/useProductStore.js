import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useProductStore = create((set, get) => ({
  loading: false,
  products: [],

  setProducts: (products) => set({ products }),
  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/products", productData);
      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to create product");
    }
  },
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/api/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to get products", loading: false });
      toast.error(error.response.data.error || "Failed to get products");
    }
  },
  deleteProduct: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/products/${id}`);
      set((prevState) => ({
        products: prevState.products.filter((product) => product._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to delete product");
    }
  },
  toggleFeaturedProduct: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/api/products/${id}`);
      set((prevState) => ({
        products: prevState.products.map((product) => {
          if (product._id === id) {
            return { ...product, isFeatured: response.data.isFeatured };
          }
          return product;
        }),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to update product");
    }
  },
  fetchProductsByCategory: async (category, sort = 'newest') => {
    set({ loading: true });
    try {
      const response = await axios.get(`/api/products/category/${category}?sort=${sort}`);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to get products", loading: false });
      toast.error(error.response.data.error || "Failed to get products");
    }
  },
  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/api/products/featured");
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
    }
  },
  updateProductSizes: async (productId, sizes, hasSizes) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/api/products/${productId}/sizes`, {
        sizes,
        hasSizes
      });
      
      set((prevState) => ({
        products: prevState.products.map((product) => {
          if (product._id === productId) {
            return {
              ...product,
              sizes: response.data.sizes,
              hasSizes: response.data.hasSizes
            };
          }
          return product;
        }),
        loading: false,
      }));
      
      toast.success("Product sizes updated successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to update product sizes");
      throw error;
    }
  },
}));
