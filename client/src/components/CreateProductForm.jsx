import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  "jeans",
  "tshirts",
  "shoes",
  "glasses",
  "jackets",
  "suits",
  "bags",
];

const CreateProductForm = () => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  });
  const { loading, createProduct } = useProductStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await createProduct(newProduct);
        setNewProduct({
          name: "",
          description: "",
          price: "",
          category: "",
          image: "",
        });
    } catch (error) {
      toast.error(error.response.data.error || "Failed to create product");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file); // base64
    }
  };

  return (
    <motion.div
      className="shadow-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-semibold mb-6">
        Create New Product
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium"
          >
            Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3  focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium"
          >
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={newProduct.description}
            onChange={(e) =>
              setNewProduct({ ...newProduct, description: e.target.value })
            }
            rows="3"
            className="mt-1 block w-full rounded-md shadow-sm py-2 px-3  focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium"
          >
            Price
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            step="0.01"
            className="mt-1 block w-full rounded-md shadow-sm py-2 px-3  focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
            className="mt-1 block w-full rounded-md shadow-sm py-2 px-3  focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-1 flex items-center">
          <input
            type="file"
            id="image"
            className="sr-only"
            accept="image/*"
            onChange={handleImageChange}
          />
          <label
            htmlFor="image"
            className="cursor-pointer py-2 px-3 border rounded-md shadow-sm text-sm leading-4 font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset focus:ring-yellow-500"
          >
            <Upload className="h-5 w-5 inline-block mr-2" />
            Upload Image
          </label>
          {newProduct.image && (
            <span className="ml-3 text-sm">Image uploaded</span>
          )}
        </div>
        <button
          type="submit"
          className="mt-1 flex w-full justify-cemter py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium  bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader
                className="mr-2 h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              Loading...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateProductForm;
