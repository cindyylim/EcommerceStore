import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  const { user } = useUserStore();
  const { addToShoppingBag } = useShoppingBagStore();
  const { addToWishlist } = useWishlistStore();

  const handleAddToShoppingBag = () => {
    if (!user) {
      toast.error("You must be logged in to add to shopping bag", {
        id: "login",
      });
      return;
    }
    addToShoppingBag(product);
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error("You must be logged in to add to wishlist", { id: "login" });
      return;
    }
    addToWishlist(product);
    toast.success("Added to Wishlist");
  };

  const availableSizes = product.sizes?.filter(size => size.inStock) || [];
  const hasAvailableSizes = availableSizes.length > 0;

  return (
    <div className="flex relative overflow-hidden rounded-lg border shadow-lg">
      <div className="relative mx-3 mt-3 flex overflow-hidden rounded-xl">
        <img
          className="object-cover w-full"
          src={product.image}
          alt="product image"
        />
      </div>
      <div className="mt-4 px-5 pb-5">
        <h5 className="text-xl font-semibold tracking-tight">{product.name}</h5>
        <div className="mt-2 mb-5 flex items-center justify-between">
          <p>
            <span className="text-xl font-bold">CAD${product.price}</span>
          </p>
        </div>
        {product.hasSizes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {hasAvailableSizes 
                ? `${availableSizes.length} sizes available`
                : "Out of stock"}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {product.sizes.map((sizeObj) => (
                <span
                  key={sizeObj.size}
                  className={`
                    px-2 py-1 text-xs rounded
                    ${sizeObj.inStock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }
                  `}
                >
                  {sizeObj.size}
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          className="flex items-center justify-center rounded-lg bg-yellow-600 my-5 px-5 py-2.5 text-center text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddToShoppingBag}
          disabled={product.hasSizes && !hasAvailableSizes}
        >
          <ShoppingCart size={22} className="mr-2" />
          {product.hasSizes && !hasAvailableSizes ? "Out of Stock" : "Add"}
        </button>
        <button
          className="flex items-center justify-center rounded-lg px-5 my-5 py-2.5 text-center text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-4"
          onClick={handleAddToWishlist}
        >
          <Heart size={22} className="mr-2" />
          Add
        </button>
        <Link
          to={`/product/${product._id}`}
          className="mt-2 inline-block text-blue-600 hover:text-blue-800"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
