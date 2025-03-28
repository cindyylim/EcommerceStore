import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

const SizeManager = ({ product, onUpdate }) => {
  const [sizes, setSizes] = useState(product.sizes || []);
  const [hasSizes, setHasSizes] = useState(product.hasSizes || false);

  const handleSizeToggle = () => {
    setHasSizes(!hasSizes);
    if (!hasSizes) {
      // When enabling sizes, add all available sizes with default values
      setSizes(AVAILABLE_SIZES.map(size => ({
        size,
        inStock: true,
        quantity: 0
      })));
    } else {
      // When disabling sizes, clear all sizes
      setSizes([]);
    }
  };

  const handleSizeChange = (size, field, value) => {
    setSizes(prevSizes => 
      prevSizes.map(s => 
        s.size === size 
          ? { ...s, [field]: value }
          : s
      )
    );
  };

  const handleSave = async () => {
    try {
      const response = await axios.patch(`/api/products/${product._id}/sizes`, {
        sizes,
        hasSizes
      });
      onUpdate(product._id, response.data);
      toast.success('Sizes updated successfully');
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to update sizes');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Size Management</h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Enable Sizes</label>
          <input
            type="checkbox"
            checked={hasSizes}
            onChange={handleSizeToggle}
            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
          />
        </div>
      </div>

      {hasSizes && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_SIZES.map(size => {
              const sizeObj = sizes.find(s => s.size === size) || {
                size,
                inStock: false,
                quantity: 0
              };
              return (
                <div key={size} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{size}</span>
                    <label className="flex items-center space-x-2">
                      <span className="text-sm">In Stock</span>
                      <input
                        type="checkbox"
                        checked={sizeObj.inStock}
                        onChange={(e) => handleSizeChange(size, 'inStock', e.target.checked)}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </label>
                  </div>
                  {sizeObj.inStock && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sizeObj.quantity}
                        onChange={(e) => handleSizeChange(size, 'quantity', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Save Size Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default SizeManager; 