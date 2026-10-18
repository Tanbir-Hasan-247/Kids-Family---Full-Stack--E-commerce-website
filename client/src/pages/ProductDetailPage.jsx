import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import api, { formatImageUrl } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CustomerReviewsSection from '../components/product/CustomerReviewsSection';
import ProductBreadcrumb from '../components/product/ProductBreadcrumb';
import ProductGallery from '../components/product/ProductGallery';
import ProductVariantSelector from '../components/product/ProductVariantSelector';
import ProductActionButtons from '../components/product/ProductActionButtons';
import ProductPerksCard from '../components/product/ProductPerksCard';
import ProductMobileStickyBar from '../components/product/ProductMobileStickyBar';

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

  const hasAnyStock = product?.variants?.some((v) => v.stock > 0);

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

  const handleColorSelect = (colorId) => {
    if (selectedColor === colorId) {
      setSelectedColor(null);
      return;
    }
    setSelectedColor(colorId);
  };

  const handleSizeSelect = (sizeId) => {
    if (selectedSize === sizeId) {
      setSelectedSize(null);
      return;
    }
    setSelectedSize(sizeId);
  };

  useEffect(() => {
    if (!product) return;

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
      const colorV = product.variants?.find((v) =>
        v.attributes?.some((a) => a.id === selectedColor)
      );
      if (colorV) setActiveVariant(colorV);
    } else if (!selectedColor && selectedSize) {
      const sizeV = product.variants?.find((v) =>
        v.attributes?.some((a) => a.id === selectedSize)
      );
      if (sizeV) setActiveVariant(sizeV);
    } else {
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
        <Link
          to="/products"
          className="text-amber-700 font-semibold text-sm mt-3 inline-block"
        >
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
    'https://placehold.co/600x800/1e293b/f8fafc?text=' +
      encodeURIComponent(product.name);
  const displayPrice = activeVariant
    ? activeVariant.price
    : product.starting_price || product.base_price;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <ProductBreadcrumb product={product} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left: Product Gallery */}
        <ProductGallery
          product={product}
          activeVariant={activeVariant}
          displayImage={displayImage}
          onSelectVariant={(v) => {
            setActiveVariant(v);
            const vColor = v.attributes?.find((a) => a.type_name === 'Color');
            const vSize = v.attributes?.find((a) => a.type_name === 'Size');
            if (vColor) setSelectedColor(vColor.id);
            if (vSize) setSelectedSize(vSize.id);
          }}
        />

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
                  <span className="text-[10px] text-emerald-600 font-medium">
                    ক্যাটাগরি:
                  </span>
                  <span>{product.category.parent_name}</span>
                </Link>
              )}
              <Link
                to={`/products?cat=${product.category?.slug || ''}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition shadow-2xs"
              >
                {product.category?.parent_name && (
                  <span className="text-[10px] text-amber-600 font-medium">
                    সাব-ক্যাটাগরি:
                  </span>
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
                  {product.average_rating
                    ? Number(product.average_rating).toFixed(1)
                    : '5.0'}
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

          {/* Color & Size Selectors */}
          <ProductVariantSelector
            product={product}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            handleColorSelect={handleColorSelect}
            isColorAvailable={isColorAvailable}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            handleSizeSelect={handleSizeSelect}
            isSizeAvailable={isSizeAvailable}
          />

          {/* Quantity & Actions */}
          <ProductActionButtons
            quantity={quantity}
            setQuantity={setQuantity}
            activeVariant={activeVariant}
            toggleWishlist={toggleWishlist}
            productId={product.id}
            favorited={favorited}
            handleAddToBag={handleAddToBag}
            handleDirectBuy={handleDirectBuy}
            addingToBag={addingToBag}
            feedbackMsg={feedbackMsg}
          />

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
          <ProductPerksCard />
        </div>
      </div>

      {/* CUSTOMER REVIEWS & PHOTO REVIEWS */}
      <CustomerReviewsSection
        productId={product.id}
        initialReviews={product.reviews || []}
        averageRating={product.average_rating || 5.0}
        reviewsCount={product.reviews_count || 0}
      />

      {/* Mobile Floating Sticky Action Bar */}
      <ProductMobileStickyBar
        displayPrice={displayPrice}
        handleAddToBag={handleAddToBag}
        handleDirectBuy={handleDirectBuy}
        addingToBag={addingToBag}
        activeVariant={activeVariant}
      />
    </div>
  );
};

export default ProductDetailPage;
