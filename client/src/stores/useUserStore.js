import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });
    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }
    try {
      const res = await axios.post("/api/auth/signup", { name, email, password });
      set({ user: res.data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      return toast.error(
        error.response.data.message || "An error occurred, try again later."
      );
    }
  },
  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/api/auth/login", { email, password });
      set({ user: res.data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      return toast.error(
        error.response.data.message || "An error occurred, try again later."
      );
    }
  },
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/api/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },
  logout: async () => {
    try {
      await axios.post("/api/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during logout. Try again later.");
    }
  },
  refreshToken: async () => {
    if (get().checkingAuth) return;
    set({ checkingAuth: true });
    try {
      await axios.post("/api/auth/refresh-token");
      set({ checkingAuth: false });
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

let refreshPromise = null;
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry on 401 if we don't have a user - fail fast
    if (error.response?.status === 401) {
      const currentUser = useUserStore.getState().user;

      // If no user is logged in, don't try to refresh - just reject immediately
      if (!currentUser) {
        return Promise.reject(error);
      }

      // Only retry once
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // If a refresh is already in progress, wait for it to complete
          if (refreshPromise) {
            await refreshPromise;
            return axios(originalRequest);
          }
          // Start a new refresh process
          refreshPromise = useUserStore.getState().refreshToken();
          await refreshPromise;
          refreshPromise = null;
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, redirect to login or handle as needed
          useUserStore.getState().logout();
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
)