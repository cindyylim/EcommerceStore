import React, { useState } from "react";
import {
  ShoppingCart,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  MapPin,
  CircleDollarSign,
  Languages,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { CIcon } from "@coreui/icons-react";
import { cifCa } from "@coreui/icons";
import Modal from "./Modal.jsx";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { shoppingBag } = useShoppingBagStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRegionalPreferences = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  return (
    <header className="fixed top-0 left-0 w-full bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-yellow-400 items-center space-x-2 flex"
          >
            E-COMMERCE
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            <Link to={"/"} className="flex items-center">
              HOME
            </Link>
            <button onClick={handleRegionalPreferences}>
              <CIcon icon={cifCa} className="inline-block mr-1 w-6 h-6" />
            </button>
            {user && (
              <Link to={"/ShoppingBag"} className="relative group">
                <ShoppingCart
                  className="inline-block mr-1 group-hover:text-yellow-400"
                  size={20}
                />
                <span className="hidden sm:inline">SHOPPING BAG</span>
                {shoppingBag.length > 0 && (
                  <span className="absolute -top-2 -left-2 bg-yellow-500  rounded-full px-2 py-0.5 text-xs group-hover:bg-yellow-400 transition duration-300 ease-in-out">
                    {shoppingBag.length}
                  </span>
                )}
              </Link>
            )}
            {isAdmin && (
              <Link
                className="hover:bg-yellow-600  px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center"
                to={"/secret-dashboard"}
              >
                <Lock className="inline-block mr-1" size={18} />
                <span className="hidden sm:inline">DASHBOARD</span>
              </Link>
            )}
            {user ? (<Link to={"/wishlist"}><Heart size={18}/></Link>) : null}
            {user ? (
              <button
                className="py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                onClick={logout}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline ml-2">LOG OUT</span>
              </button>
            ) : (
              <>
                <Link
                  to={"/signup"}
                  className="py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  <UserPlus className="mr-2" size={18} />
                  SIGN UP
                </Link>
                <Link
                  to={"/login"}
                  className="py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  <LogIn className="mr-2" size={18} />
                  LOG IN
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2 className="text-xl font-bold mb-4">Regional Preferences</h2>
        <p className="py-3">How would you like to shop?</p>
        <hr className="my-1 border-gray-300" />
        <div className="py-3 flex items-end justify-items-end gap-6">
          <MapPin />
          <p>Ship to</p>
          <p className="text-gray-600 underline">Canada</p>
        </div>
        <hr className="my-1 border-gray-300" />
        <div className="py-3 flex items-end justify-items-end gap-6">
          <CircleDollarSign />
          <p>Currency</p>
          <p className="text-gray-600">Canadian Dollar(CAD)</p>
        </div>
        <hr className="my-1 border-gray-300" />
        <div className="py-3 flex items-end justify-items-end gap-6">
          <Languages />
          <p>Language</p>
          <p className="text-gray-600">English</p>
        </div>
      </Modal>
    </header>
  );
};

export default Navbar;
