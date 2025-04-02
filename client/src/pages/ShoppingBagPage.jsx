import React, { useEffect } from "react";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { motion } from "framer-motion";
import ShoppingBagItem from "../components/ShoppingBagItem";
import YouMightLike from "../components/YouMightLike";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";
import axios from "../lib/axios";
const ShoppingBagPage = () => {
  const { shoppingBag, getShoppingBagItems } = useShoppingBagStore();
  
  // Clean up expired locks when user visits shopping bag
  useEffect(() => {
    const cleanupExpiredLocks = async () => {
      try {
        await axios.post('/api/shoppingbag/cleanup-expired-locks');
        // Refresh shopping bag items after cleanup
        await getShoppingBagItems();
      } catch (error) {
        console.error('Error cleaning up expired locks:', error);
      }
    };
    
    cleanupExpiredLocks();
  }, [getShoppingBagItems]);
  
  return (
    <div className="py-8 md:py-16">
      <div className="mx-auto max-w-screen-3xl px-4 2xl:px-0">
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {shoppingBag.length === 0 ? (
              <EmptyShoppingBagUI />
            ) : (
              <div className="space-y-6">
                {shoppingBag.map((item) => (
                  <ShoppingBagItem key={`${item._id}-${item.selectedSize}`} item={item} />
                ))}
              </div>
            )}
            {shoppingBag.length > 0 && <YouMightLike />}
          </motion.div>
          {shoppingBag.length > 0 && (
            <motion.div
              className="mx-auto mt-6 flex-1 space-y-6 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="lg:block lg:w-96 lg:space-y-6">
                <OrderSummary />
                <GiftCouponCard />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingBagPage;

const EmptyShoppingBagUI = () => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-4 py-16"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <ShoppingCart className="h-24 w-24 text-gray-300" />
    <h3 className="text-2xl font-semibold">Your shopping bag is empty</h3>
    <p className="text-gray-400">
      Looks like you {"haven't"} added anything to your shopping bag yet.
    </p>
    <Link
      className="mt-4 rounded-md bg-indigo-500 px-6 py-2  transition-colors hover:bg-indigo-600"
      to="/"
    >
      Start Shopping
    </Link>
  </motion.div>
);
