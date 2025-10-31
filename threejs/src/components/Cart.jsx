import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Cart = ({ isOpen, onClose, token }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchCart();
    }
  }, [isOpen, token]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/cart/${cartItemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setCartItems(
          cartItems.filter((item) => item.cartItemId !== cartItemId)
        );
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/cart/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setCartItems([]);
        onClose();
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Checkout failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Shopping Cart
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {cartItems.length}{" "}
                    {cartItems.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full 
                           bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white 
                           transition-all duration-200 border border-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-gray-400 mt-4">Loading your cart...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-12 h-12 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500">
                    Add some designs to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.cartItemId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 
                               border border-gray-700 hover:border-gray-600 
                               transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="flex gap-4">
                        <div className="relative">
                          <img
                            src={item.thumbnail || "/placeholder.png"}
                            alt="Design"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-700"
                          />
                          <div
                            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 
                                        text-white text-xs rounded-full flex items-center 
                                        justify-center font-bold shadow-lg"
                          >
                            {item.quantity}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg mb-1 truncate">
                            {item.designName || "Custom Design"}
                          </h3>
                          <div className="flex flex-col gap-1 text-sm">
                            <p className="text-gray-400 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              Qty: {item.quantity}
                            </p>
                            <p className="text-gray-500 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {new Date(item.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="self-start px-3 py-2 bg-red-600/20 hover:bg-red-600 
                                   text-red-400 hover:text-white rounded-lg text-sm font-medium
                                   transition-all duration-200 border border-red-600/30 
                                   hover:border-red-600 flex items-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Only show when cart has items */}
            {cartItems.length > 0 && (
              <div className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {cartItems.length} items
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between text-white text-lg font-bold">
                    <span>Total</span>
                    <span>{cartItems.length} designs</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 
                           hover:from-blue-700 hover:to-blue-600 text-white rounded-xl 
                           font-bold text-lg transition-all duration-200 
                           shadow-lg hover:shadow-blue-500/50 flex items-center 
                           justify-center gap-2 group"
                >
                  <span>Proceed to Checkout</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
