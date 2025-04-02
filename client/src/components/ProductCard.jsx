import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { Link } from "react-router-dom";
import { useState } from "react";

const ProductCard = ({ product }) => {
  const { user } = useUserStore();
  const { addToShoppingBag } = useShoppingBagStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToBag, setIsAddingToBag] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const handleAddToShoppingBag = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("You must be logged in to add to shopping bag", {
        id: "login",
      });
      return;
    }

    if (product.hasSizes) {
      toast.error("Please select a size first", { id: "size-required" });
      return;
    }

    setIsAddingToBag(true);
    try {
      await addToShoppingBag(product._id);
      toast.success("Added to shopping bag!", { 
        icon: "🛒",
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      toast.error("Failed to add to shopping bag");
    } finally {
      setIsAddingToBag(false);
    }
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("You must be logged in to add to wishlist", { id: "login" });
      return;
    }

    setIsAddingToWishlist(true);
    try {
      if (isInWishlist(product._id)) {
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

  const availableSizes = product.sizes?.filter(size => size.inStock) || [];
  const hasAvailableSizes = availableSizes.length > 0;
  const isInWishlistItem = isInWishlist(product._id);

  return (
    <div 
      className="group relative bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-500 overflow-hidden hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay Actions */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <button
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg backdrop-blur-sm transition-all duration-300 ${
                isInWishlistItem 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isInWishlistItem ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={16} className={isInWishlistItem ? 'fill-current' : ''} />
            </button>
            <Link
              to={`/product/${product._id}`}
              className="flex-1 flex items-center justify-center p-2 rounded-lg backdrop-blur-sm bg-white/90 text-gray-700 hover:bg-white transition-all duration-300"
              aria-label="Quick view"
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isFeatured && (
            <span className="badge badge-primary shadow-medium">
              Featured
            </span>
          )}
          {!product.inStock && (
            <span className="badge badge-danger shadow-medium">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon (Always Visible) */}
        <button
          onClick={handleAddToWishlist}
          disabled={isAddingToWishlist}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isInWishlistItem 
              ? 'bg-red-500 text-white shadow-medium' 
              : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-110'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isInWishlistItem ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} className={isInWishlistItem ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 group-hover:text-indigo-600 transition-colors duration-300">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-gray-900">
            ${product.price}
          </p>
          {product.hasSizes && (
            <span className="text-sm text-gray-500">
              {hasAvailableSizes ? `${availableSizes.length} sizes` : "Out of stock"}
            </span>
          )}
        </div>

        {/* Size Indicators */}
        {product.hasSizes && (
          <div className="flex flex-wrap gap-1">
            {product.sizes.slice(0, 6).map((sizeObj) => (
              <span
                key={sizeObj.size}
                className={`
                  w-7 h-7 rounded-full text-xs flex items-center justify-center font-medium transition-all duration-200
                  ${sizeObj.inStock
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }
                `}
              >
                {sizeObj.size}
              </span>
            ))}
            {product.sizes.length > 6 && (
              <span className="text-xs text-gray-500 self-center">
                +{product.sizes.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Rating Placeholder */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={`${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">(4.0)</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleAddToShoppingBag}
            disabled={!product.inStock || (product.hasSizes && !hasAvailableSizes) || isAddingToBag}
            className={`btn btn-primary flex-1 group relative overflow-hidden ${
              !product.inStock || (product.hasSizes && !hasAvailableSizes)
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${isAddingToBag ? 'scale-0' : 'scale-100'}`}>
              <ShoppingCart size={18} />
              {product.hasSizes ? 'Select Size' : 'Add to Bag'}
            </span>
            {isAddingToBag && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="spinner w-5 h-5"></div>
              </div>
            )}
          </button>
          
          <Link
            to={`/product/${product._id}`}
            className="btn btn-outline px-4"
            aria-label="View product details"
          >
            <Eye size={18} />
          </Link>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default ProductCard;
