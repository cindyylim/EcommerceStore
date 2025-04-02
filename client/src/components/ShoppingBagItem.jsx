import React, { useState, useEffect } from "react";
import { Minus, Plus, Trash, Edit2, Save, X } from "lucide-react";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const ShoppingBagItem = ({ item }) => {
  const { removeFromShoppingBag, updateQuantity } = useShoppingBagStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(item.quantity);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    setIsUpdating(true);
    setTempQuantity(newQuantity);
    try {
      console.log(item, newQuantity, item.selectedSize);
      await updateQuantity(item._id, newQuantity, item.selectedSize);
      toast.success("Quantity updated");
    } catch (error) {
      toast.error("Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await removeFromShoppingBag(item._id, item.selectedSize);
      toast.success("Item removed from bag", {
        icon: "🗑️",
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (tempQuantity !== item.quantity && tempQuantity > 0 && tempQuantity <= 99) {
      await handleQuantityChange(tempQuantity);
      // Exit edit mode after successful update
      setIsEditing(false);
    } else {
      // If quantity hasn't changed, just exit edit mode
      setIsEditing(false);
    }
  };

  const handleQuickRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to remove this item?")) {
      await handleRemove();
    }
  };

  const itemTotal = (item.price * item.quantity).toFixed(2);

  // Determine if item is unavailable or has limited stock
  const isUnavailable = item.isAvailable === false;
  const hasLimitedStock = item.maxQuantity && item.maxQuantity < item.quantity;
  const stockWarning = item.stockWarning;
  const errorMessage = item.errorMessage;

  return (
    <motion.div
      className={`card card-hover ${isUnavailable ? 'border-red-200 bg-red-50' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="p-4 md:p-6">
        {/* Availability Status Alert */}
        {isUnavailable && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage || "This item is currently unavailable"}
                </p>
              </div>
            </div>
          </div>
        )}

        {stockWarning && !isUnavailable && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  {stockWarning}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
          {/* Product Image */}
          <div className="md:col-span-3">
            <Link
              to={`/product/${item._id}`}
              className="block relative group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                />
              </div>
              
              {/* Quick View Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">Quick View</span>
              </div>
              
              {/* Unavailable Overlay */}
              {isUnavailable && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Unavailable</span>
                </div>
              )}
            </Link>
          </div>

          {/* Product Details */}
          <div className="md:col-span-5 space-y-2">
            <div>
              <Link 
                to={`/product/${item._id}`}
                className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors duration-200 line-clamp-2"
              >
                {item.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* Size and Variant Info */}
            <div className="flex flex-wrap gap-3 text-sm">
              {item.selectedSize && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-700">Size:</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-900">
                    {item.selectedSize}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-700">Price:</span>
                <span className="text-gray-900">${item.price}</span>
              </div>
            </div>


            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/product/${item._id}`}
                className="btn btn-outline btn-sm"
              >
                View Details
              </Link>
              
              <button
                onClick={handleQuickRemove}
                disabled={isUpdating}
                className="btn btn-danger btn-sm"
              >
                <Trash size={14} className="mr-1" />
                Remove
              </button>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="md:col-span-2">
            <div className="flex flex-col items-center space-y-3">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1 || isUnavailable}
                  className="p-2 rounded-lg border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                
                <AnimatePresence mode="wait">
                  {!isEditing ? (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-16 text-center font-semibold text-lg"
                    >
                      {item.quantity}
                    </motion.div>
                  ) : (
                    <motion.input
                      key="input"
                      type="number"
                      min="1"
                      max={hasLimitedStock ? item.maxQuantity : 99}
                      value={tempQuantity}
                      onChange={(e) => setTempQuantity(Math.max(1, Math.min(hasLimitedStock ? item.maxQuantity : 99, parseInt(e.target.value) || 1)))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                      onBlur={handleSaveEdit}
                      className="w-16 text-center font-semibold text-lg border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      autoFocus
                    />
                  )}
                </AnimatePresence>
                
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= 99 || (hasLimitedStock && item.quantity >= item.maxQuantity) || isUnavailable}
                  className="p-2 rounded-lg border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={isEditing ? handleSaveEdit : setIsEditing(true)}
                disabled={isUnavailable}
                className="btn btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? (
                  <>
                    <Save size={14} className="mr-1" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 size={14} className="mr-1" />
                    Edit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Item Total */}
          <div className="md:col-span-2 text-right">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Item Total</span>
                <div className="text-2xl font-bold text-gray-900">
                  ${itemTotal}
                </div>
              </div>
              
              {item.quantity > 1 && (
                <div className="text-sm text-gray-500">
                  ${item.price} each
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShoppingBagItem;
