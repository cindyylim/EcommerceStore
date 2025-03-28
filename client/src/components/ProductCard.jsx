import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";

const ProductCard = ({ product }) => {
  const { user } = useUserStore();
  const { addToShoppingBag } = useShoppingBagStore();

  const handleAddToShoppingBag = () => {
    if (!user) {
      toast.error("You must be logged in to add to shopping bag", { id: "login" });
      return;
    }
    addToShoppingBag(product);
    toast.success("Added to ShoppingBag");
  };
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
        <h5 className="text-xl font-semibold tracking-tight">
          {product.name}
        </h5>
        <div className="mt-2 mb-5 flex items-center justify-between">
          <p>
            <span className="text-xl font-bold">
              CAD${product.price}
            </span>
          </p>
        </div>
        <button
          className="flex items-center justify-center rounded-lg bg-yellow-600 px-5 py-2.5 text-center text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          onClick={handleAddToShoppingBag}
        >
          <ShoppingCart size={22} className="mr-2" />
          Add
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
