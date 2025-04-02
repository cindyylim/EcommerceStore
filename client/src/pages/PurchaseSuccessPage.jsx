import { ArrowRight, CheckCircle, HandHeart, AlertTriangle } from "lucide-react";
import React, { useEffect } from "react";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { useCheckoutStore } from "../stores/useCheckoutStore";
import Confetti from "react-confetti";
import { Link } from "react-router-dom";

const PurchaseSuccessPage = () => {
  const { clearShoppingBag } = useShoppingBagStore();
  const { isProcessing, orderId, error, handleCheckoutSuccess, hasProcessed } = useCheckoutStore();

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");

    if (sessionId && !hasProcessed) {
      handleCheckoutSuccess(sessionId).then((result) => {
        // Clear shopping bag only on successful checkout (not on error)
        if (result?.success) {
          clearShoppingBag();
        }
      });
    }
  }, [handleCheckoutSuccess, hasProcessed, clearShoppingBag]);

  if (isProcessing) return "Processing...";

  if (error) {
    if (error.type === 'stock_shortage') {
      return (
        <div className="h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-lg shadow-xl overflow-hidden relative z-10">
            <div className="flex justify-center">
              <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-red-500 mb-2">
              Stock Issue Detected. Please contact support.
            </h1>
            <p className="text-center mb-4">
              {error.message}
            </p>
            <div className="space-y-4">
              <Link
                to={"/"}
                className="w-full bg-indigo-600 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center text-white"
              >
                Continue Shopping <ArrowRight className="ml-2" size={18} />
              </Link>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-lg shadow-xl overflow-hidden relative z-10">
            <div className="flex justify-center">
              <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-red-500 mb-2">
              Checkout Error
            </h1>
            <p className="text-center mb-6">
              {error.message}
            </p>
            <div className="space-y-4">
              <Link
                to={"/"}
                className="w-full bg-indigo-600 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center text-white"
              >
                Continue Shopping <ArrowRight className="ml-2" size={18} />
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }
  return (
    <div className="h-screen flex items-center justify-center px-4">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.1}
        style={{ zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />
      <div className="max-w-md w-full rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="flex justify-center">
          <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-indigo-400 mb-2">
          Payment Successful
        </h1>
        <p className="text-center mb-2">
          Thank you for your order. {"We're"} processing it now.
        </p>
        <p className="text-center text-sm mb-6">
          Check your email for order details and updates.
        </p>
        <div className="rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm"> Order number</span>
            <span className="text-sm font-semibold">
              {orderId || "No order ID found"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Estimated delivery</span>
            <span className="text-sm font-semibold">
              3-5 business days
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-full bg-indigo-600 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center">
            <HandHeart className="mr-2" size={18} />
            Thanks for your support.
          </div>
          <Link
            to={"/"}
            className="w-full font-bold py-2 px-4 hover:bg-indigo-600 rounded-lg transition duration-300 flex items-center justify-center"
          >
            Continue Shopping <ArrowRight className="ml-2" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
