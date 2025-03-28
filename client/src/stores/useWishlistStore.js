import { create } from 'zustand';
import axios from 'axios';

export const useWishlistStore = create((set, get) => ({
    wishlistItems: [],
    isLoading: false,
    error: null,

    getWishlistItems: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get('/api/wishlist');
            set({ wishlistItems: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    addToWishlist: async (productId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post('/api/wishlist', { productId });
            set((state) => ({
                wishlistItems: [...state.wishlistItems, response.data],
                isLoading: false
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    removeFromWishlist: async (productId) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`/api/wishlist/${productId}`);
            set((state) => ({
                wishlistItems: state.wishlistItems.filter(item => item.productId !== productId),
                isLoading: false
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    isInWishlist: (productId) => {
        return get().wishlistItems.some(item => item.productId === productId);
    }
}));

