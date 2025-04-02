import React, { useState, useEffect } from "react";
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
  Menu,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { CIcon } from "@coreui/icons-react";
import { cifCa } from "@coreui/icons";
import Modal from "./Modal.jsx";
import SearchBar from "./SearchBar.jsx";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { shoppingBag } = useShoppingBagStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleRegionalPreferences = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Home", icon: null },
    { to: "/categories", label: "Categories", icon: null },
    { to: "/deals", label: "Deals", icon: null },
    { to: "/about", label: "About", icon: null },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white/90 backdrop-blur-sm shadow-md border-b border-gray-100'
      }`}>
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-300"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="hidden sm:inline">E-COMMERCE</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${location.pathname === link.to ? 'nav-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <SearchBar />
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Regional Preferences */}
              <button
                onClick={handleRegionalPreferences}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                aria-label="Regional preferences"
              >
                <CIcon icon={cifCa} className="w-5 h-5" />
              </button>

              {/* Shopping Bag */}
              {user && (
                <Link
                  to="/ShoppingBag"
                  className="relative group p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
                  aria-label="Shopping bag"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
                  {shoppingBag.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-soft">
                      {shoppingBag.length > 99 ? '99+' : shoppingBag.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Wishlist */}
              {user && (
                <Link
                  to="/wishlist"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5 text-gray-600 group-hover:text-pink-500" />
                </Link>
              )}

              {/* Admin Dashboard */}
              {isAdmin && (
                <Link
                  to="/secret-dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300"
                >
                  <Lock className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        My Orders
                      </Link>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="btn btn-outline"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
            isSearchOpen ? 'max-h-16 py-3' : 'max-h-0'
          }`}>
            <SearchBar />
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
        isMobileMenuOpen 
          ? 'opacity-100 visible' 
          : 'opacity-0 invisible'
      }`}>
        <div className="absolute inset-0 bg-black/50" onClick={toggleMobileMenu} />
        <div className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block py-2 text-lg font-medium transition-colors duration-200 ${
                      location.pathname === link.to 
                        ? 'text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Mobile Actions */}
              <div className="space-y-4">
                <button
                  onClick={toggleSearch}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>

                <button
                  onClick={handleRegionalPreferences}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                >
                  <CIcon icon={cifCa} className="w-5 h-5" />
                  <span>Regional Settings</span>
                </button>

                {user && (
                  <>
                    <Link
                      to="/ShoppingBag"
                      className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Shopping Bag</span>
                      {shoppingBag.length > 0 && (
                        <span className="ml-auto bg-indigo-500 text-white text-xs rounded-full px-2 py-1">
                          {shoppingBag.length}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/wishlist"
                      className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Wishlist</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/secret-dashboard"
                        className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                      >
                        <Lock className="w-5 h-5" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-200">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full btn btn-outline"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </button>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="w-full btn btn-outline"
                    onClick={toggleMobileMenu}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full btn btn-primary"
                    onClick={toggleMobileMenu}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regional Preferences Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Regional Preferences</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Ship to</p>
                  <p className="text-sm text-gray-600">Select your shipping destination</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-medium">Canada</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <CircleDollarSign className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Currency</p>
                  <p className="text-sm text-gray-600">Choose your preferred currency</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-medium">CAD</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <Languages className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Language</p>
                  <p className="text-sm text-gray-600">Select your preferred language</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-medium">English</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={closeModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={closeModal}
              className="btn btn-primary"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
