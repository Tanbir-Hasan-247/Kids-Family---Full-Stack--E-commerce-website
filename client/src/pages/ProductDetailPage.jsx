import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Star,
  ChevronRight,
} from 'lucide-react';
import api, { formatImageUrl } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CustomerReviewsSection from '../components/product/CustomerReviewsSection';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorited } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToBag, setAddingToBag] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/products/${id}/`);
        const prod = res.data;
        setProduct(prod);

        // Initially keep Color and Size unclicked/unselected so user can freely explore all options
        setSelectedColor(null);
        setSelectedSize(null);
        setActiveVariant(null);
      } catch (err) {
        console.error('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // Check if any variant has stock > 0
  const hasAnyStock = product?.variants?.some((v) => v.stock > 0);

  // Check if a size is available given current selectedColor
  const isSizeAvailable = (sizeId) => {
    if (!product?.variants || product.variants.length === 0) return true;
    if (!selectedColor) {
      return product.variants.some((v) => {
        const hasSize = v.attributes?.some((a) => a.id === sizeId);
        return hasSize && (!hasAnyStock || v.stock > 0);
      });
    }
    return product.variants.some((v) => {
      const hasColor = v.attributes?.some((a) => a.id === selectedColor);
      const hasSize = v.attributes?.some((a) => a.id === sizeId);
      return hasColor && hasSize && (!hasAnyStock || v.stock > 0);
    });
  };

  // Check if a color is available given current selectedSize
  const isColorAvailable = (colorId) => {
    if (!product?.variants || product.variants.length === 0) return true;
    if (!selectedSize) {
      return product.variants.some((v) => {
        const hasColor = v.attributes?.some((a) => a.id === colorId);
        return hasColor && (!hasAnyStock || v.stock > 0);
      });
    }
    return product.variants.some((v) => {
      const hasColor = v.attributes?.some((a) => a.id === colorId);
      const hasSize = v.attributes?.some((a) => a.id === selectedSize);
      return hasColor && hasSize && (!hasAnyStock || v.stock > 0);
    });
  };

  // Color selection handler with toggle (click to select, click again to unselect/clear)
  const handleColorSelect = (colorId) => {
    if (selectedColor === colorId) {
      setSelectedColor(null);
      return;
    }
    setSelectedColor(colorId);
  };

  // Size selection handler with toggle (click to select, click again to unselect/clear)
  const handleSizeSelect = (sizeId) => {
    if (selectedSize === sizeId) {
      setSelectedSize(null);
      return;
    }
    setSelectedSize(sizeId);
  };

  // When selectedColor or selectedSize changes, update activeVariant
  useEffect(() => {
    if (!product) return;

    // Both selected
    if (selectedColor && selectedSize) {
      const matched = product.variants?.find((v) => {
        const hasColor = v.attributes?.some((a) => a.id === selectedColor);
        const hasSize = v.attributes?.some((a) => a.id === selectedSize);
        return hasColor && hasSize;
      });

      if (matched) {
        setActiveVariant(matched);
      } else {
        const findVariant = async () => {
          try {
            const res = await api.get(
              `/products/${product.id}/variant/?color=${selectedColor}&size=${selectedSize}`
            );
            if (res.data.available) {
              const found = product.variants?.find((v) => v.id === res.data.variant_id);
              setActiveVariant(found || res.data);
            }
          } catch (err) {
            console.log('Variant not found for combination');
          }
        };
        findVariant();
      }
    } else if (selectedColor && !selectedSize) {
      // Preview image of this color
      const colorV = product.variants?.find((v) =>
        v.attributes?.some((a) => a.id === selectedColor)
      );
      if (colorV) setActiveVariant(colorV);
    } else if (!selectedColor && selectedSize) {
      // Preview image of this size
      const sizeV = product.variants?.find((v) =>
        v.attributes?.some((a) => a.id === selectedSize)
      );
      if (sizeV) setActiveVariant(sizeV);
    } else {
      // Neither selected
      setActiveVariant(null);
    }
  }, [selectedColor, selectedSize, product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-3/4 bg-neutral-200 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-8 bg-neutral-200 rounded-lg w-3/4" />
            <div className="h-6 bg-neutral-200 rounded-lg w-1/4" />
            <div className="h-32 bg-neutral-200 rounded-lg w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <Link to="/products" className="text-amber-700 font-semibold text-sm mt-3 inline-block">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleAddToBag = async () => {
    if (product.colors?.length > 0 && !selectedColor) {
      setFeedbackMsg('অনুগ্রহ করে একটি কালার নির্বাচন করুন');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      setFeedbackMsg('অনুগ্রহ করে একটি সাইজ নির্বাচন করুন');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    if (!activeVariant) {
      setFeedbackMsg('অনুগ্রহ করে কালার ও সাইজ নির্বাচন করুন');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    setAddingToBag(true);
    const result = await addToCart(activeVariant.id, quantity);
    setAddingToBag(false);
    if (!result.success) {
      setFeedbackMsg(result.message);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleDirectBuy = async () => {
    if (product.colors?.length > 0 && !selectedColor) {
      setFeedbackMsg('অনুগ্রহ করে একটি কালার নির্বাচন করুন');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      setFeedbackMsg('অনুগ্রহ করে একটি সাইজ নির্বাচন করুন');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    if (!activeVariant) {
      setFeedbackMsg('অনুগ্রহ করে কালার ও সাইজ নির্বাচন করুন');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    setAddingToBag(true);
    const result = await addToCart(activeVariant.id, quantity);
    setAddingToBag(false);
    if (result.success) {
      navigate('/checkout');
    } else {
      setFeedbackMsg(result.message);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const favorited = isFavorited(product.id);
  const rawImage = activeVariant?.image || product.variants?.[0]?.image;
  const displayImage =
    formatImageUrl(rawImage) ||
    'https://placehold.co/600x800/1e293b/f8fafc?text=' + encodeURIComponent(product.name);
  const displayPrice = activeVariant ? activeVariant.price : (product.starting_price || product.base_price);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-400 mb-6 sm:mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Link to="/" className="hover:text-neutral-700 transition">হোম</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
        <Link to="/products" className="hover:text-neutral-700 transition">সকল পণ্য</Link>
        {product.category?.parent_name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
            <Link
              to={`/products?cat=${product.category.parent_slug || ''}`}
              className="hover:text-amber-800 font-semibold text-neutral-600 transition"
            >
              {product.category.parent_name}
            </Link>
          </>
        )}
        {product.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
            <Link
              to={`/products?cat=${product.category.slug || ''}`}
              className="hover:text-amber-800 font-semibold text-neutral-600 transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
        <span className="text-neutral-800 font-bold truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left: Product Image */}
        <div className="space-y-3 sm:space-y-4">
          <div className="aspect-3/4 rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-md relative group">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {activeVariant?.is_on_sale && activeVariant.discount_percent > 0 && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-rose-600 text-white text-[11px] sm:text-xs font-black px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-md">
                {activeVariant.discount_percent}% OFF
              </span>
            )}
          </div>

          {/* Variant / Gallery Thumbnails */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pt-1">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setActiveVariant(v);
                    const vColor = v.attributes?.find((a) => a.type_name === 'Color');
                    const vSize = v.attributes?.find((a) => a.type_name === 'Size');
                    if (vColor) setSelectedColor(vColor.id);
                    if (vSize) setSelectedSize(vSize.id);
                  }}
                  className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeVariant?.id === v.id
                      ? 'border-[#1b3b2b] shadow-sm ring-2 ring-[#1b3b2b]/20'
                      : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={formatImageUrl(v.image) || displayImage}
                    alt={v.sku}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Controls */}
        <div className="space-y-6">
          <div>
            {/* Category Badges with Parent Category */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {product.category?.parent_name && (
                <Link
                  to={`/products?cat=${product.category.parent_slug || ''}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
                >
                  <span className="text-[10px] text-emerald-600 font-medium">ক্যাটাগরি:</span>
                  <span>{product.category.parent_name}</span>
                </Link>
              )}
              <Link
                to={`/products?cat=${product.category?.slug || ''}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition shadow-2xs"
              >
                {product.category?.parent_name && (
                  <span className="text-[10px] text-amber-600 font-medium">সাব-ক্যাটাগরি:</span>
                )}
                <span>{product.category?.name || 'Exclusive Family Wear'}</span>
              </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
              {product.name}
            </h1>

            {/* Rating badge */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="text-xs font-black text-neutral-800">
                  {product.average_rating ? Number(product.average_rating).toFixed(1) : '5.0'}
                </span>
              </div>
              <span className="text-neutral-300">•</span>
              <a
                href="#reviews-section"
                className="text-xs font-bold text-neutral-600 hover:text-amber-800 transition underline underline-offset-2"
              >
                {product.reviews_count || product.reviews?.length || 0} টি কাস্টমার রিভিউ ও ফটো
              </a>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-200">
            <span className="text-3xl font-black text-[#1b3b2b]">
              ৳{displayPrice}
            </span>
            {activeVariant?.compare_at_price && (
              <span className="text-base text-neutral-400 line-through">
                ৳{activeVariant.compare_at_price}
              </span>
            )}
            {activeVariant?.stock !== undefined ? (
              <span
                className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
                  activeVariant.stock > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeVariant.stock > 0
                  ? `In Stock (${activeVariant.stock} available)`
                  : 'Out of Stock'}
              </span>
            ) : (
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                In Stock
              </span>
            )}
          </div>

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    কালার (Color):
                  </label>
                  {selectedColor && (
                    <button
                      type="button"
                      onClick={() => setSelectedColor(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 transition cursor-pointer"
                      title="কালার সিলেকশন মুছে ফেলুন"
                    >
                      ✕ মুছে ফেলুন
                    </button>
                  )}
                </div>
                {product.colors.find((c) => c.id === selectedColor) && (
                  <span className="text-xs font-bold text-[#1b3b2b] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {product.colors.find((c) => c.id === selectedColor)?.value}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c) => {
                  const isAvailable = isColorAvailable(c.id);
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleColorSelect(c.id)}
                      title={!isAvailable ? `নির্বাচিত সাইজের সাথে ${c.value} রঙটি প্রযোজ্য নয়` : c.value}
                      className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                        !isAvailable
                          ? 'border-neutral-200 bg-neutral-100/70 text-neutral-400 opacity-35 cursor-not-allowed line-through select-none'
                          : isSelected
                            ? 'border-[#1b3b2b] bg-[#1b3b2b] text-white shadow-sm ring-2 ring-[#1b3b2b]/20 scale-[1.02]'
                            : 'border-neutral-300 bg-white text-neutral-800 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer'
                      }`}
                    >
                      {c.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    সাইজ (Size):
                  </label>
                  {selectedSize && (
                    <button
                      type="button"
                      onClick={() => setSelectedSize(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 transition cursor-pointer"
                      title="সাইজ সিলেকশন মুছে ফেলুন"
                    >
                      ✕ মুছে ফেলুন
                    </button>
                  )}
                </div>
                {product.sizes.find((s) => s.id === selectedSize) && (
                  <span className="text-xs font-bold text-[#1b3b2b] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {product.sizes.find((s) => s.id === selectedSize)?.value}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => {
                  const isAvailable = isSizeAvailable(s.id);
                  const isSelected = selectedSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSizeSelect(s.id)}
                      title={!isAvailable ? `নির্বাচিত রঙের সাথে ${s.value} সাইজটি প্রযোজ্য নয়` : s.value}
                      className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                        !isAvailable
                          ? 'border-neutral-200 bg-neutral-100/70 text-neutral-400 opacity-35 cursor-not-allowed line-through select-none'
                          : isSelected
                            ? 'border-[#1b3b2b] bg-[#1b3b2b] text-white shadow-sm ring-2 ring-[#1b3b2b]/20 scale-[1.02]'
                            : 'border-neutral-300 bg-white text-neutral-800 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer'
                      }`}
                    >
                      {s.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selection guidance prompt if not selected */}
          {((product.colors?.length > 0 && !selectedColor) || (product.sizes?.length > 0 && !selectedSize)) && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {!selectedColor && !selectedSize
                  ? 'অর্ডার করতে অনুগ্রহ করে পছন্দের কালার ও সাইজ নির্বাচন করুন'
                  : !selectedColor
                    ? 'অর্ডার করতে অনুগ্রহ করে কালার নির্বাচন করুন'
                    : 'অর্ডার করতে অনুগ্রহ করে সাইজ নির্বাচন করুন'}
              </span>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300 rounded-2xl bg-neutral-50 px-2 py-1 shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-neutral-600 hover:text-neutral-900"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-neutral-900">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) =>
                      activeVariant?.stock ? Math.min(activeVariant.stock, q + 1) : q + 1
                    )
                  }
                  className="p-2 text-neutral-600 hover:text-neutral-900"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-2xl border transition shadow-xs shrink-0 ${
                  favorited
                    ? 'border-rose-300 bg-rose-50 text-rose-500'
                    : 'border-neutral-300 text-neutral-600 hover:text-rose-500 hover:bg-neutral-50'
                }`}
                title={favorited ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${favorited ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            {/* Action Buttons: Add to Bag & Direct Buy (GhorerBazar style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleAddToBag}
                disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-[#1b3b2b] text-[#1b3b2b] hover:bg-[#1b3b2b] hover:text-white disabled:border-neutral-300 disabled:text-neutral-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{(activeVariant && activeVariant.stock < 1) ? 'Out of Stock' : 'কার্ট-এ যোগ করুন'}</span>
              </button>

              <button
                onClick={handleDirectBuy}
                disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:bg-neutral-300 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>সরাসরি অর্ডার করুন</span>
              </button>
            </div>

            {feedbackMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-6 border-t border-neutral-200 space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Product Description
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Perks list */}
          <div className="p-4 bg-neutral-100/70 rounded-2xl border border-neutral-200/60 space-y-2.5 text-xs text-neutral-700">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>Standard delivery fee: ৳60 (Dhaka) / ৳120 (Outside Dhaka)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>7-Day easy size exchange guarantee</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Pay on delivery after inspecting package</span>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER REVIEWS & PHOTO REVIEWS */}
      <CustomerReviewsSection
        productId={product.id}
        initialReviews={product.reviews || []}
        averageRating={product.average_rating || 5.0}
        reviewsCount={product.reviews_count || 0}
      />

      {/* Mobile Floating Sticky Action Bar (GhorerBazar style) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
        <div>
          <span className="text-[10px] text-neutral-400 block font-medium">মূল্য:</span>
          <span className="text-base font-black text-[#1b3b2b]">
            ৳{displayPrice}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <button
            onClick={handleAddToBag}
            disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
            className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-[#1b3b2b] shrink-0 active:scale-95 transition"
            title="Add to Cart"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>

          <button
            onClick={handleDirectBuy}
            disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <Zap className="w-4 h-4 fill-white shrink-0" />
            <span>সরাসরি অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

