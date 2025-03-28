import { useParams, useSearchParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore.js";
import { useEffect } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { motion } from "framer-motion";
import SortSelect from "../components/SortSelect";

const CategoryPage = () => {
  const { fetchProductsByCategory, products } = useProductStore();
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    fetchProductsByCategory(category, sort);
  }, [fetchProductsByCategory, category, sort]);

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-yellow-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </motion.h1>
          <SortSelect />
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {products?.length === 0 && (
            <h2 className="text-3xl font-semibold text-center col-span-full">
              No products found
            </h2>
          )}
          {products && Array.isArray(products) && products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CategoryPage;
