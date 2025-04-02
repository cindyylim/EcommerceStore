import React, { useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { motion } from "framer-motion";
import { Star, Trash, Ruler } from "lucide-react";
import SizeManager from "./SizeManager";

const ProductList = () => {
  const { deleteProduct, toggleFeaturedProduct, products, setProducts} = useProductStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSizeManager, setShowSizeManager] = useState(false);

  const handleSizeUpdate = (productId, updatedProduct) => {
    setShowSizeManager(false);
    setProducts(products.map(product => product._id === productId ? updatedProduct : product));
  };

  return (
    <div className="space-y-8">
      <motion.div
        className="shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <table className="min-w-full divide-y">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Featured
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Sizes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={product.image}
                        alt={product.name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium ">
                        {product.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    CAD${product.price.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">{product.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleFeaturedProduct(product._id)}
                    className={`p-1 rounded-full ${
                      product.isFeatured
                        ? "bg-indigo-400 text-gray-900"
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    <Star className="h-5 w-5" />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {product.hasSizes 
                        ? `${product.sizes?.filter(s => s.inStock).length || 0} sizes`
                        : 'No sizes'}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowSizeManager(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      <Ruler className="h-5 w-5" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Size Manager Modal */}
      {showSizeManager && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center my-10">
              <h2 className="text-xl font-bold">Manage Sizes - {selectedProduct.name}</h2>
              <button
                onClick={() => setShowSizeManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SizeManager
              product={selectedProduct}
              onUpdate={handleSizeUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
