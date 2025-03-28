import React, { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import FeaturedProducts from "../components/FeaturedProducts";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  { href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
  { href: "/tshirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
  { href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
  { href: "/glasses", name: "Glasses", imageUrl: "/glasses.jpg" },
  { href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
  { href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
  { href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
];
const HomePage = () => {
  const {fetchFeaturedProducts, products, isLoading} = useProductStore();
  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts])
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-center text-5xl sm:text-6xl font-bold text-yellow-400 mb-4">
          Explore Our Categories
        </h1>
        <p className="text-center text-xl mb-12">
          Discover the latest trends in eco-friendly fashion
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>
      </div>
      {!isLoading && products.length > 0 && <FeaturedProducts featuredProducts={products}></FeaturedProducts>}
    </div>
  );
};
export default HomePage;
