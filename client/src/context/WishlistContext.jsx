import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await api.get('/wishlist/');
      setItems(res.data.items || []);
      setCount(res.data.count || 0);
      const ids = new Set((res.data.items || []).map((i) => i.product_id));
      setFavoritedIds(ids);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    try {
      const res = await api.post(`/wishlist/toggle/${productId}/`);
      setCount(res.data.count);
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (res.data.favorited) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
      // Refresh items list
      await fetchWishlist();
      return res.data;
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      return { success: false };
    }
  };

  const isFavorited = (productId) => favoritedIds.has(Number(productId));

  return (
    <WishlistContext.Provider
      value={{
        items,
        count,
        toggleWishlist,
        isFavorited,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);

