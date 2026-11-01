import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wishlistApi from '../api/wishlistApi';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await wishlistApi.getWishlist();
      const rawItems = Array.isArray(res) ? res : res?.items || res?.results || [];
      setItems(rawItems);
      setCount(typeof res?.count === 'number' ? res.count : rawItems.length);

      // Extract product IDs
      const ids = new Set();
      rawItems.forEach((item) => {
        const pId = item.product_id || item.product?.id || item.id;
        if (pId) ids.add(Number(pId));
      });
      setFavoritedIds(ids);
    } catch (err) {
      console.warn('WishlistContext: Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist, user]);

  const toggleWishlist = async (productId) => {
    if (!productId) return { success: false };
    const pId = Number(productId);

    // 1. Optimistic UI update
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pId)) {
        next.delete(pId);
      } else {
        next.add(pId);
      }
      return next;
    });

    try {
      const res = await wishlistApi.toggleWishlist(pId);
      const isFav = res?.favorited ?? res?.is_favorited;

      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.add(pId);
        } else {
          next.delete(pId);
        }
        return next;
      });

      if (typeof res?.count === 'number') {
        setCount(res.count);
      }

      // Refresh full list in background
      fetchWishlist();
      return res;
    } catch (err) {
      console.warn('WishlistContext: toggle error, rolling back:', err);
      // Rollback on error
      fetchWishlist();
      return { success: false };
    }
  };

  const isFavorited = useCallback(
    (productId) => {
      if (!productId) return false;
      return favoritedIds.has(Number(productId));
    },
    [favoritedIds]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        count,
        loading,
        toggleWishlist,
        isFavorited,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    return {
      items: [],
      count: 0,
      loading: false,
      toggleWishlist: async () => ({}),
      isFavorited: () => false,
      fetchWishlist: () => {},
    };
  }
  return context;
}

export default WishlistContext;

