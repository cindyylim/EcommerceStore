import React from 'react';

const SizeSelector = ({ sizes, selectedSize, onSizeSelect, disabled = false }) => {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Size:
      </label>
      <div className="flex flex-wrap gap-2">
        {sizes.map((sizeObj) => (
          <button
            key={sizeObj.size}
            onClick={() => onSizeSelect(sizeObj.size)}
            disabled={!sizeObj.inStock || disabled}
            className={`
              px-4 py-2 rounded-md border
              ${selectedSize === sizeObj.size
                ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                : 'border-gray-300 hover:border-yellow-400'
              }
              ${!sizeObj.inStock
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-yellow-50'
              }
              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
            `}
          >
            <div className="flex flex-col items-center">
              <span>{sizeObj.size}</span>
              {!sizeObj.inStock && (
                <span className="text-xs text-red-500">Out of Stock</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector; 