import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart/');
      setCart(res.data);
      setItems(res.data.items || []);
      setTotalItems(res.data.total_items || 0);
      setTotalPrice(res.data.total_price || '0.00');
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  const addToCart = async (variantId, quantity = 1, openDrawer = true) => {
    setLoading(true);
    try {
      const res = await api.post('/cart/add/', {
        variant_id: variantId,
        quantity,
      });
      if (res.data.cart) {
        setCart(res.data.cart);
        setItems(res.data.cart.items || []);
        setTotalItems(res.data.cart.total_items || 0);
        setTotalPrice(res.data.cart.total_price || '0.00');
      } else {
        await fetchCart();
      }
      if (openDrawer) {
        setIsDrawerOpen(true);
      }
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to bag.';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, action, quantity = null) => {
    try {
      const payload = action === 'set' ? { action: 'set', quantity } : { action };
      const res = await api.patch(`/cart/items/${itemId}/`, payload);
      if (res.data.cart) {
        setCart(res.data.cart);
        setItems(res.data.cart.items || []);
        setTotalItems(res.data.cart.total_items || 0);
        setTotalPrice(res.data.cart.total_price || '0.00');
      }
    } catch (err) {
      console.error('Failed to update cart item:', err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}/remove/`);
      if (res.data.cart) {
        setCart(res.data.cart);
        setItems(res.data.cart.items || []);
        setTotalItems(res.data.cart.total_items || 0);
        setTotalPrice(res.data.cart.total_price || '0.00');
      }
    } catch (err) {
      console.error('Failed to remove cart item:', err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.post('/cart/clear/');
      setCart(res.data.cart);
      setItems([]);
      setTotalItems(0);
      setTotalPrice('0.00');
    } catch (err) {
      console.error('Failed to clear cart:', err);
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
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

