import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatImageUrl } from '../../api/axios';

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const autoPlayRef = useRef(null);

  // Fetch live hero sliders from backend
  useEffect(() => {
    let isMounted = true;
    const fetchSliders = async () => {
      try {
        const res = await api.get('/promotions/sliders/');
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : [];
        if (isMounted) {
          setSlides(data);
        }
      } catch (err) {
        if (isMounted) setSlides([]);
      }
    };

    fetchSliders();
    return () => {
      isMounted = false;
    };
  }, []);

  const total = slides.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // 5-second Autoplay with pause on hover/interaction
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [total, isPaused, nextSlide]);

  // Touch Swipe gestures for mobile & tablet (like GhorerBazar)
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const diff = touchStartX - touchEndX;
    const swipeThreshold = 40;

    if (diff > swipeThreshold) {
      nextSlide();
    } else if (diff < -swipeThreshold) {
      prevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (slides.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="relative w-full rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-r from-[#1b3b2b] via-[#244f3a] to-[#142e22] text-white p-7 sm:p-12 lg:p-16 shadow-md flex flex-col justify-center items-start space-y-3 sm:space-y-4">
          <span className="bg-amber-400/20 text-amber-300 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
            প্রিমিয়াম ফ্যামিলি ফ্যাশন
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-2xl">
            বাচ্চা ও পরিবারের সেরা পোশাক কালেকশন
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 max-w-xl">
            ১০০% সুতি আরামদায়ক কাপড়, প্রিমিয়াম ফিনিশিং এবং আকর্ষণীয় ডিজাইনের ট্রেন্ডি পোশাক।
          </p>
          <Link
            to="/products"
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-900 font-black text-xs sm:text-sm rounded-full transition shadow-md active:scale-95"
          >
            <span>কালেকশন দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex] || slides[0];
  const currentDesktopImg = currentSlide ? formatImageUrl(currentSlide.image) : '';
  const currentMobileImg = currentSlide?.mobile_image ? formatImageUrl(currentSlide.mobile_image) : currentDesktopImg;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
      {/* 
        GhorerBazar Style Responsive Hero Slider:
        - Contained in container (max-w-7xl, max-width 1320px)
        - Natural Flow Spacer Image guarantees 100% full image is visible on ALL devices (especially mobile)
        - Mobile: Zero cropping, full banner image displays edge-to-edge
        - Desktop: Capped at max-h-[460px] with elegant widescreen proportion
        - Rounded corners & subtle shadow
        - Clicking anywhere on the banner navigates to the target URL
      */}
      <div
        className="relative w-full rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden bg-neutral-100 group select-none shadow-xs min-h-[120px] sm:min-h-[200px] max-h-[460px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Promotional Hero Banner Slider"
      >
        {/* 
          Natural Flow Spacer:
          The spacer image adopts w-full h-auto block in natural document flow.
          This dynamically forces the container height to match the EXACT aspect ratio
          of the uploaded banner on mobile, tablet, and desktop.
        */}
        {currentDesktopImg && (
          <picture className="block w-full h-auto invisible pointer-events-none select-none" aria-hidden="true">
            {currentMobileImg && currentMobileImg !== currentDesktopImg && (
              <source media="(max-width: 640px)" srcSet={currentMobileImg} />
            )}
            <img
              src={currentDesktopImg}
              alt=""
              aria-hidden="true"
              className="w-full h-auto block invisible pointer-events-none select-none max-h-[460px]"
            />
          </picture>
        )}

        {/* Slide Layers Positioned Absolute Over Natural Footprint */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            const desktopImg = formatImageUrl(slide.image);
            const mobileImg = slide.mobile_image ? formatImageUrl(slide.mobile_image) : desktopImg;

            return (
              <Link
                key={slide.id || index}
                to={slide.link_url || '/products'}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer block ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <picture className="block w-full h-full">
                  {mobileImg && mobileImg !== desktopImg && (
                    <source
                      media="(max-width: 640px)"
                      srcSet={mobileImg}
                    />
                  )}
                  <img
                    src={desktopImg}
                    alt={slide.title || 'Kids & Family Promotional Banner'}
                    className="w-full h-full object-contain sm:object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </picture>
              </Link>
            );
          })}
        </div>

        {/* Navigation Arrows (Prev / Next) - GhorerBazar hover style */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous Slide"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white active:scale-90 text-neutral-800 shadow-md flex items-center justify-center transition-all duration-200 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:text-neutral-950 backdrop-blur-xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next Slide"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white active:scale-90 text-neutral-800 shadow-md flex items-center justify-center transition-all duration-200 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:text-neutral-950 backdrop-blur-xs cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Pagination Indicators (Dots / Active Pill) */}
        {total > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/25 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xs">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 sm:w-7 bg-white shadow-xs'
                    : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
export default HeroCarousel;
