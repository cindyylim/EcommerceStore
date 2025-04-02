import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Check } from 'lucide-react';

const SizeSelector = ({ 
  sizes, 
  selectedSize, 
  onSizeSelect, 
  disabled = false,
  showStockInfo = true,
  sizeGuide = null 
}) => {
  const [hoveredSize, setHoveredSize] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  if (!sizes || sizes.length === 0) return null;

  const getSizeStatus = (sizeObj) => {
    if (!sizeObj.inStock) return 'out-of-stock';
    if (sizeObj.quantity <= 5) return 'low-stock';
    return 'in-stock';
  };

  const getSizeStatusColor = (status) => {
    switch (status) {
      case 'out-of-stock':
        return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
      case 'low-stock':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      default:
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300';
    }
  };

  const getSelectedSizeColor = (sizeObj) => {
    if (selectedSize === sizeObj.size) {
      return 'bg-primary-500 text-white border-primary-600 shadow-glow';
    }
    return getSizeStatusColor(getSizeStatus(sizeObj));
  };

  const handleSizeClick = (sizeObj) => {
    if (disabled || !sizeObj.inStock) return;
    onSizeSelect(sizeObj.size);
  };

  const handleSizeInfo = (sizeObj) => {
    setHoveredSize(sizeObj.size);
  };

  const sortedSizes = [...sizes].sort((a, b) => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
    const aIndex = sizeOrder.indexOf(a.size);
    const bIndex = sizeOrder.indexOf(b.size);
    
    if (aIndex === -1 && bIndex === -1) return a.size.localeCompare(b.size);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-4">
      {/* Size Selector Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-900">
          Select Size:
        </label>
        
        {sizeGuide && (
          <button
            onClick={() => setShowSizeGuide(!showSizeGuide)}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            <Info size={16} />
            <span>Size Guide</span>
          </button>
        )}
      </div>

      {/* Size Guide */}
      <AnimatePresence>
        {showSizeGuide && sizeGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Size Guide</h4>
              <div className="text-sm text-gray-600">
                {sizeGuide}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Options */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {sortedSizes.map((sizeObj) => {
          const status = getSizeStatus(sizeObj);
          const isSelected = selectedSize === sizeObj.size;
          const isHovered = hoveredSize === sizeObj.size;

          return (
            <motion.button
              key={sizeObj.size}
              onClick={() => handleSizeClick(sizeObj)}
              onMouseEnter={() => handleSizeInfo(sizeObj)}
              onMouseLeave={() => setHoveredSize(null)}
              disabled={disabled || !sizeObj.inStock}
              className={`
                relative p-3 rounded-lg border-2 font-semibold text-sm
                transition-all duration-300 transform
                ${getSelectedSizeColor(sizeObj)}
                ${!disabled && sizeObj.inStock ? 'hover:scale-105 active:scale-95' : ''}
                focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
              `}
              whileHover={{ scale: disabled || !sizeObj.inStock ? 1 : 1.05 }}
              whileTap={{ scale: disabled || !sizeObj.inStock ? 1 : 0.95 }}
            >
              {/* Size Label */}
              <span className="relative z-10">
                {sizeObj.size}
              </span>

              {/* Selected Indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-primary-500 rounded-lg"
                  >
                    <Check size={16} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stock Status Tooltip */}
              <AnimatePresence>
                {isHovered && showStockInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20"
                  >
                    {status === 'out-of-stock' && 'Out of Stock'}
                    {status === 'low-stock' && `Only ${sizeObj.quantity} left`}
                    {status === 'in-stock' && 'In Stock'}
                    
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Low Stock Indicator */}
              {status === 'low-stock' && !isSelected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse-soft" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Stock Information */}
      {showStockInfo && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-3">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>In Stock</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
            <span>Low Stock (≤5)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Out of Stock</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {disabled && (
        <div className="alert alert-warning text-sm mt-3">
          <div className="flex items-center space-x-2">
            <Info size={16} />
            <span>Size selection temporarily unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeSelector;