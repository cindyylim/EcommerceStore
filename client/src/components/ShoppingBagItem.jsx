import React from "react";
import { Minus, Plus, Trash } from "lucide-react";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { Link } from "react-router-dom";

const ShoppingBagItem = ({ item }) => {
  const { removeFromShoppingBag, updateQuantity } = useShoppingBagStore();
  return (
    <div className="rounded-lg border p-4 shadow-sm md:p-6">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        <div className="shrink-0 md:order-1">
          <img className="h-20 md:h-32 rounded object-cover" src={item.image} />
        </div>
        <label className="sr-only">Choose quantity:</label>
        <div className="flex items-center justify-between md:order-3 md:justify-end">
          <button
            onClick={() => updateQuantity(item._id, item.quantity - 1)}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <Minus />
          </button>
          <p className="px-4">{item.quantity}</p>
          <button
            onClick={() => updateQuantity(item._id, item.quantity + 1)}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <Plus />
          </button>
        </div>
        <div className="text-end md:order-4 md:w-32">
          <p className="text-base font-bold">CAD${item.price}</p>
        </div>
      </div>
      <div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
        <p className="text-base font-medium">{item.name}</p>
        <p className="text-sm">{item.description}</p>
        <Link
          to={`/product/${item._id}`}
          className="mb-2 inline-block text-blue-600 hover:text-blue-800"
        >
          View Details
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => removeFromShoppingBag(item._id)}
            className="inline-flex items-center text-sm font-medium text-red-400 hover:text-red-300 hover:underline"
          >
            <Trash className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingBagItem;
