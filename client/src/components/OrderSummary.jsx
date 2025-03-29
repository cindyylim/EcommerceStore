import React, { useState, useEffect } from "react";
import { useShoppingBagStore } from "../stores/useShoppingBagStore";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";

const stripePromise = loadStripe(
  "pk_test_51R5VjHIm1NY2Sep6AZLPbAzXDMLaoNbENv7RXWQjDh8XeKFW5yxdX1y0qLWunTamRiqhoS05537tIiEJSoWfNhu600CChUjzSU"
);

const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, shoppingBag } =
    useShoppingBagStore();
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  let formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);
  const [shippingInfo, setNewShippingInfo] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    email: "",
    phone: "",
  });

  // Calculate shipping cost
  const shippingCost = selectedShipping === "standard" ? 15 : 20;

  // Calculate final total with shipping
  formattedTotal = Number(formattedTotal) + shippingCost;
  const taxes = Number(formattedTotal) * 0.12;
  const finalTotal = Number(formattedTotal) + taxes;

  const handleShippingChange = (event) => {
    setSelectedShipping(event.target.value);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!shippingInfo.firstName) {
      alert("First name is required");
      return;
    } else if (!shippingInfo.lastName) {
      alert("Last name is required");
      return;
    } else if (!shippingInfo.address) {
      alert("Address is required");
      return;
    } else if (!shippingInfo.city) {
      alert("City is required");
      return;
    } else if (!shippingInfo.province) {
      alert("Province is required");
      return;
    } else if (!shippingInfo.postalCode) {
      alert("Postal code is required");
      return;
    } else if (!shippingInfo.email) {
      alert("Email is required");
      return;
    } else if (!shippingInfo.phone) {
      alert("Phone number is required");
      return;
    }
    const stripe = await stripePromise;
    const res = await axios.post("/api/payments/create-checkout-session", {
      products: shoppingBag,
      coupon: coupon ? coupon.code : null,
      name: shippingInfo.firstName + " " + shippingInfo.lastName,
      email: shippingInfo.email,
      phone: shippingInfo.phone,
      address:
        shippingInfo.address +
        ", " +
        shippingInfo.city +
        ", " +
        shippingInfo.province +
        ", " +
        shippingInfo.postalCode,
    });
    const session = res.data;
    const result = await stripe.redirectToCheckout({ sessionId: session.id });
    if (result.error) {
      console.error("Error: ", result.error);
    }
  };
  return (
    <div>
      {/* Order Items Summary */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-4">
          {shoppingBag && shoppingBag.length > 0 ? (
            shoppingBag.map((item, index) => (
              <div
                key={`order-item-${item._id}-${item.selectedSize || 'no-size'}-${index}`}
                className="flex justify-between items-start border-b pb-4"
              >
                <div className="flex-1">
                  <h3 className="font-medium">
                    {item.name || "Unnamed Product"}
                  </h3>
                  {item.selectedSize && (
                    <p className="text-sm text-gray-600">
                      Size: {item.selectedSize}
                    </p>
                  )}
                  {item.errorMessage && (
                    <p className="text-sm text-red-600">
                      {item.errorMessage}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity || 1}
                  </p>
                  {item.stockWarning && (
                    <p className="text-sm text-amber-600">
                      {item.stockWarning}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    ${(item.price || 0).toFixed(2)} each
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No items in your shopping bag
            </p>
          )}
        </div>
      </div>

      {/* Subtotal and Discounts */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>${formattedSubtotal}</span>
        </div>
        {isCouponApplied && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Discount</span>
            <span>-${formattedSavings}</span>
          </div>
        )}
        <div className="flex justify-between mb-2">
          <span>Shipping</span>
          <span>${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Taxes</span>
          <span>${taxes.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <p className="bg-gray-200 text-2xl font-semibold py-3 my-4 px-5">
        Ship to Address
      </p>
      <p className="text-xl bg-gray-700 py-3 mb-5 text-white text-center">
        Home Delivery
      </p>
      <p className="text-2xl font-semibold py-3">Shipping Speed</p>
      <form>
        <div className="mb-4">
          <input
            type="radio"
            name="shipping"
            value="standard"
            className="mr-2"
            checked={selectedShipping === "standard"}
            onChange={handleShippingChange}
          />
          <label className="font-semibold">
            Standard - $15.00 CAD.
            <br />
          </label>
          <label>Est. Delivery: 6-7 business days</label>
        </div>
        <div className="mb-4">
          <input
            type="radio"
            name="shipping"
            value="express"
            className="mr-2"
            checked={selectedShipping === "express"}
            onChange={handleShippingChange}
          />
          <label className="font-semibold">
            Express - $20.00 CAD
            <br />
          </label>
          <label>Est. Delivery: 2-3 business days</label>
        </div>
        <div>
          <p className="text-2xl font-semibold">Shipping Address</p>
          <input
            type="text"
            placeholder="First Name"
            className="w-full border border-gray-300 p-2 mb-2"
            value={shippingInfo.firstName}
            onChange={(e) =>
              setNewShippingInfo({
                ...shippingInfo,
                firstName: e.target.value,
              })
            }
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="w-full border border-gray-300 p-2 mb-2"
            value={shippingInfo.lastName}
            onChange={(e) =>
              setNewShippingInfo({
                ...shippingInfo,
                lastName: e.target.value,
              })
            }
            required
          />
          <input
            type="text"
            placeholder="Address"
            className="w-full border border-gray-300 p-2 mb-2"
            value={shippingInfo.address}
            onChange={(e) =>
              setNewShippingInfo({
                ...shippingInfo,
                address: e.target.value,
              })
            }
            required
          />
          <input
            type="text"
            placeholder="City"
            className="w-full border border-gray-300 p-2 mb-2"
            value={shippingInfo.city}
            onChange={(e) =>
              setNewShippingInfo({
                ...shippingInfo,
                city: e.target.value,
              })
            }
            required
          />
          <select
            id="province"
            name="province"
            required
            className="w-full border border-gray-300 p-2 mb-2"
            value={shippingInfo.province}
            onChange={(e) =>
              setNewShippingInfo({
                ...shippingInfo,
                province: e.target.value,
              })
            }
          >
            <option value="">Province</option>
            <option value="AB">Alberta</option>
            <option value="BC">British Columbia</option>
            <option value="MB">Manitoba</option>
            <option value="NB">New Brunswick</option>
            <option value="NL">Newfoundland and Labrador</option>
            <option value="NT">Northwest Territory</option>
            <option value="NS">Nova Scotia</option>
            <option value="NU">Nunavut</option>
            <option value="ON">Ontario</option>
            <option value="PE">Prince Edward Island</option>
            <option value="QC">Quebec</option>
            <option value="SK">Saskatchewan</option>
            <option value="YT">Yukon</option>
          </select>
          <input
            type="text"
            placeholder="Postal Code"
            className="w-full border border-gray-300 p-2 mb-2"
            value={shippingInfo.postalCode}
            onChange={(e) =>
              setNewShippingInfo({
                ...shippingInfo,
                postalCode: e.target.value,
              })
            }
            required
          />
        </div>
        <p className="bg-gray-200 text-2xl font-semibold py-3 my-4 px-5">
          Order Contact
        </p>
        <input
          type="text"
          placeholder="Email Address"
          className="w-full border border-gray-300 p-2 mb-2"
          value={shippingInfo.email}
          onChange={(e) =>
            setNewShippingInfo({
              ...shippingInfo,
              email: e.target.value,
            })
          }
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          className="w-full border border-gray-300 p-2 mb-2"
          value={shippingInfo.phone}
          onChange={(e) =>
            setNewShippingInfo({
              ...shippingInfo,
              phone: e.target.value,
            })
          }
          required
        />
        <button
          onClick={handlePayment}
          className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors mt-4"
        >
          Proceed to Payment
        </button>
      </form>
    </div>
  );
};

export default OrderSummary;
