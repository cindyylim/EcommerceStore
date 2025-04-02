import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCheckoutStore = create((set, get) => ({
  isProcessing: false,
  orderId: null,
  error: null,
  hasProcessed: false,
  checkoutSuccessful: false,

  handleCheckoutSuccess: async (sessionId) => {
    // Prevent multiple calls using store state
    const state = get();
    if (state.hasProcessed || state.isProcessing) return;

    set({ isProcessing: true, hasProcessed: true });

    try {
      const res = await axios.post("/api/payments/checkout-success", { sessionId });
      set({ orderId: res.data.orderId, checkoutSuccessful: true });
      return { success: true, data: res.data };
    } catch (error) {
      console.log(error);
      const errorData = error.response?.data;

      if (errorData?.requiresRefund) {
        set({
          error: {
            type: 'stock_shortage',
            message: errorData.message,
            sessionId: errorData.sessionId,
            refundId: errorData.refundId,
            refundStatus: errorData.refundStatus,
            refundFailed: errorData.refundFailed
          },
          checkoutSuccessful: false
        });
        toast.error(errorData.message);
      } else {
        set({
          error: {
            type: 'general',
            message: errorData?.message || "An error occurred during checkout"
          },
          checkoutSuccessful: false
        });
        toast.error(errorData?.message || "An error occurred during checkout");
      }
      return { success: false, error: errorData };
    } finally {
      set({ isProcessing: false });
    }
  },

  resetCheckoutState: () => {
    set({
      isProcessing: false,
      orderId: null,
      error: null,
      hasProcessed: false,
      checkoutSuccessful: false
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));