import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  ShoppingCart, 
  Star, 
  Minus, 
  Plus, 
  Eye,
  Share2,
  ArrowRight
} from 'lucide-react';
import Modal from './Modal';
import SizeSelector from './SizeSelector';
import { useUserStore } from '../stores/useUserStore';
import { useShoppingBagStore } from '../stores/useShoppingBagStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { toast } from 'react-hot-toast';

const QuickView = ({ product, isOpen, onClose }) => {
  const { user } = useUserStore();
  const { addToShoppingBag } = useShoppingBagStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToBag, setIsAddingToBag] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset state when product changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setCurrentImageIndex(0);
  }, [product]);

  if (!product) return null;

  const availableSizes = product.sizes?.filter(size => size.inStock) || [];
  const hasAvailableSizes = availableSizes.length > 0;
  const isInWishlistItem = isInWishlist(product._id);
  const totalPrice = (product.price * quantity).toFixed(2);

  const handleAddToBag = async () => {
    if (!user) {
      toast.error("You must be logged in to add to shopping bag");
      return;
    }

    if (product.hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    setIsAddingToBag(true);
    try {
      await addToShoppingBag(product._id, selectedSize);
      toast.success("Added to shopping bag!", {
        icon: "🛒",
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      onClose();
    } catch (error) {
      toast.error("Failed to add to shopping bag");
    } finally {
      setIsAddingToBag(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error("You must be logged in to add to wishlist");
      return;
    }

    setIsAddingToWishlist(true);
    try {
      if (isInWishlistItem) {
        await removeFromWishlist(product._id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product._id);
        toast.success("Added to wishlist!", {
          icon: "❤️",
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.origin + `/product/${product._id}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/product/${product._id}`);
      toast.success("Product link copied to clipboard!");
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      className="quick-view-modal"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  currentImageIndex === i 
                    ? 'border-primary-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={product.image}
                  alt={`${product.name} view ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>
            
            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">(4.0 • 128 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price}
              </span>
              {product.hasSizes && (
                <span className="text-sm text-gray-500">per item</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>
          </div>

          {/* Size Selection */}
          {product.hasSizes && (
            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
              showStockInfo={true}
            />
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Quantity:
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-16 text-center border-0 focus:ring-0"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 99}
                  className="p-2 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">${totalPrice}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToBag}
              disabled={
                !product.inStock || 
                (product.hasSizes && !hasAvailableSizes) || 
                (product.hasSizes && !selectedSize) ||
                isAddingToBag
              }
              className="btn btn-primary btn-lg w-full relative overflow-hidden group"
            >
              <span className={`flex items-center justify-center transition-transform duration-300 ${
                isAddingToBag ? 'scale-0' : 'scale-100'
              }`}>
                <ShoppingCart size={20} className="mr-2" />
                {product.hasSizes ? 'Add to Bag' : 'Add to Bag'}
              </span>
              
              {isAddingToBag && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary-600">
                  <div className="spinner w-6 h-6"></div>
                </div>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWishlistToggle}
                disabled={isAddingToWishlist}
                className={`btn btn-outline relative overflow-hidden group ${
                  isInWishlistItem ? 'border-red-500 text-red-500 hover:bg-red-50' : ''
                }`}
              >
                <span className={`flex items-center justify-center transition-transform duration-300 ${
                  isAddingToWishlist ? 'scale-0' : 'scale-100'
                }`}>
                  <Heart 
                    size={16} 
                    className={`mr-2 ${isInWishlistItem ? 'fill-current' : ''}`} 
                  />
                  {isInWishlistItem ? 'Remove' : 'Wishlist'}
                </span>
                
                {isAddingToWishlist && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="spinner w-4 h-4"></div>
                  </div>
                )}
              </button>

              <button
                onClick={handleShare}
                className="btn btn-outline"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Product Features */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900">Features:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Easy Returns</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>

          {/* View Full Details */}
          <div className="pt-4 border-t">
            <button
              onClick={() => {
                onClose();
                window.open(`/product/${product._id}`, '_blank');
              }}
              className="w-full btn btn-ghost group"
            >
              <span className="flex items-center justify-center">
                View Full Details
                <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickView;