import SignupPage from "./pages/SignupPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ShoppingBagPage from "./pages/ShoppingBagPage.jsx";
import Navbar from "./components/Navbar.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./stores/useUserStore.js";
import { useEffect } from "react";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { useShoppingBagStore } from "./stores/useShoppingBagStore.js";
import PurchaseCancelPage from "./pages/PurchaseCancelPage.jsx";

function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getShoppingBagItems } = useShoppingBagStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    getShoppingBagItems();
  }, [getShoppingBagItems, user]);

  if (checkingAuth) return <LoadingSpinner />;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative pt-20"></div>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignupPage />}
        ></Route>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage />}
        ></Route>
        <Route
          path="/secret-dashboard"
          element={
            user?.role === "admin" ? <AdminPage /> : <Navigate to="/login" />
          }
        ></Route>
        <Route path="/category/:category" element={<CategoryPage />}></Route>
        <Route
          path="/ShoppingBag"
          element={user ? <ShoppingBagPage /> : <Navigate to="/login" />}
        ></Route>
        <Route
          path="/purchase-success"
          element={user ? <PurchaseSuccessPage /> : <Navigate to="/login" />}
        ></Route>
        <Route
          path="/purchase-cancel"
          element={user ? <PurchaseCancelPage /> : <Navigate to="/login" />}
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
