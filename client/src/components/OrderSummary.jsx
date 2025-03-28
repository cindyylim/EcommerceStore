import React from "react";
import { motion } from "framer-motion";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";

const stripePromise = loadStripe("pk_test_51R5VjHIm1NY2Sep6AZLPbAzXDMLaoNbENv7RXWQjDh8XeKFW5yxdX1y0qLWunTamRiqhoS05537tIiEJSoWfNhu600CChUjzSU");

const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, ShoppingBag } = useShoppingBagStore();
  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);

  const handlePayment = async () => {
    const stripe = await stripePromise;
    const res = await axios.post("/api/payments/create-checkout-session", {
      products: ShoppingBag,
      coupon: coupon ? coupon.code : null,
    });
    const session = res.data;
    const result = await stripe.redirectToCheckout({sessionId: session.id});
    if (result.error) {
        console.error("Error: ", result.error);
    }
  };
  return (
    <motion.div
      className="space-y-4 rounded-lg border p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold">Order summary</p>
      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal">
              Original price
            </dt>
            <dd className=" text-base font-medium">
              CAD${formattedSubtotal}
            </dd>
          </dl>
          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal">You saved</dt>
              <dd className="text-base font-medium">
                CAD${formattedSavings}
              </dd>
            </dl>
          )}
          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal">
                Coupon ({coupon.code})
              </dt>
              <dd className="text-base font-medium">
                -{coupon.discountPercentage}%
              </dd>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4 border-t pt-2">
            <dt className=" text-base font-bold">Total</dt>
            <dd className="text-base font-bold">
              CAD${formattedTotal}
            </dd>
          </dl>
        </div>
        <motion.button
          className="flex w-full items-center justify-center rounded-lg bg-yellow-600 px-5 py-2.5 text-sm font-medium  hover:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
        >
          Proceed to checkout
        </motion.button>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium underline hover:text-gray-800 hover:no-underline"
          >
            Continue Shopping <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
