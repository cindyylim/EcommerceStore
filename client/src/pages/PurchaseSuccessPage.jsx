import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import axios from "../lib/axios.js";
import Confetti from "react-confetti";
import { Link } from "react-router-dom"; 
import toast from "react-hot-toast";

const PurchaseSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearShoppingBag } = useShoppingBagStore();
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCheckoutSuccess = async (sessionId) => {
      setIsProcessing(true);
      if (isProcessing) return;
      try {
        const res = await axios.post("/api/payments/checkout-success", { sessionId });
        setOrderId(res.data.orderId);
        toast.success(res.data.message);
        clearShoppingBag();
      } catch (error) {
        console.log(error);
        toast.error(error.response?.data?.message || "An error occurred during checkout");
      } finally {
        setIsProcessing(false);
      }
    };
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );
    if (sessionId) {
      handleCheckoutSuccess(sessionId);
    } else {
      setIsProcessing(false);
      setError("No session ID found in the URL");
    }
  }, []);

  if (isProcessing) return "Processing...";

  if (error) return `Error : ${error}`;
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
          <CheckCircle className="text-yellow-400 w-16 h-16 mb-4" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-yellow-400 mb-2">
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
          <div className="w-full bg-yellow-600 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center">
            <HandHeart className="mr-2" size={18} />
            Thanks for your support.
          </div>
          <Link
            to={"/"}
            className="w-full font-bold py-2 px-4 hover:bg-yellow-600 rounded-lg transition duration-300 flex items-center justify-center"
          >
            Continue Shopping <ArrowRight className="ml-2" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
