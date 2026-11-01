// Shopping Cart Context & State Management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartApi from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext({
  cart: null,
  items: [],
  totalItems: 0,
  totalPrice: '0.00',
  loading: false,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [loading, setLoading] = useState(false);

  // Fetch active cart from server
  const fetchCart = useCallback(async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
      setItems(data.items || []);
      setTotalItems(data.total_items || 0);
      setTotalPrice(data.total_price || '0.00');
    } catch (err) {
      console.warn('Failed to load cart:', err?.message);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  // Add variant to cart
  const addToCart = async (variantId, quantity = 1) => {
    setLoading(true);
    try {
      const res = await cartApi.addToCart(variantId, quantity);
      if (res.cart) {
        setCart(res.cart);
        setItems(res.cart.items || []);
        setTotalItems(res.cart.total_items || 0);
        setTotalPrice(res.cart.total_price || '0.00');
      } else {
        await fetchCart();
      }
      return { success: true, message: res.message || 'Added to bag' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to bag.';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity ('increase', 'decrease', or numeric direct quantity)
  const updateQuantity = async (itemId, actionOrQty, quantity = null) => {
    try {
      const res = await cartApi.updateCartItem(itemId, actionOrQty, quantity);
      if (res.cart) {
        setCart(res.cart);
        setItems(res.cart.items || []);
        setTotalItems(res.cart.total_items || 0);
        setTotalPrice(res.cart.total_price || '0.00');
      } else {
        await fetchCart();
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      return { success: false, message: msg };
    }
  };

  // Remove single item from cart
  const removeItem = async (itemId) => {
    try {
      const res = await cartApi.removeCartItem(itemId);
      if (res.cart) {
        setCart(res.cart);
        setItems(res.cart.items || []);
        setTotalItems(res.cart.total_items || 0);
        setTotalPrice(res.cart.total_price || '0.00');
      } else {
        await fetchCart();
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove item';
      return { success: false, message: msg };
    }
  };

  // Clear all items in cart
  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      setCart(null);
      setItems([]);
      setTotalItems(0);
      setTotalPrice('0.00');
      return { success: true };
    } catch (err) {
      console.warn('Failed to clear cart:', err?.message);
      return { success: false };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        totalItems,
        totalPrice,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
