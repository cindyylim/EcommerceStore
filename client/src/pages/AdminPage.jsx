import { BarChart, PlusCircle, ShoppingBasket } from "lucide-react";
import { useState, useEffect } from "react";
import Analytics from "../components/Analytics";
import CreateProductForm from "../components/CreateProductForm";
import ProductList from "../components/ProductList";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";

const tabs = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", icon: BarChart },
];

/**
 * AdminPage component renders the admin dashboard with three main sections:
 * - Create Product: Allows admin to add new products.
 * - Products: Displays a list of existing products.
 * - Analytics: Shows analytics data.
 * Users can switch between these sections using the navigation tabs.
 */

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const { fetchAllProducts } = useProductStore();
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.h1
          className="text-4xl font-bold mb-8 text-yellow-400 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Admin Dashboard
        </motion.h1>
        <div className="flex justify-center mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
                activeTab === tab.id
                  ? "bg-yellow-600 "
                  : "hover:bg-yellow-600"
              }`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "create" && <CreateProductForm />}
        {activeTab === "products" && <ProductList />}
        {activeTab === "analytics" && <Analytics />}
      </div>
    </div>
  );
};

export default AdminPage;
