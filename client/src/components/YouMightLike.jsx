import React, {useState, useEffect}from "react";
import ProductCard from "./ProductCard.jsx";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner.jsx";

const YouMightLike = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/api/products/recommendations");
        setRecommendations(res.data.products);
      } catch (error) {
        toast.error(
          error.response.data.message ||
            "An error occurred while fetching recommendations"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (isLoading) {
    return <LoadingSpinner/>
  }
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold">
        YOU MIGHT LIKE
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2">
        {recommendations.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default YouMightLike;
