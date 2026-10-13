import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatImageUrl } from '../../api/axios';

// Fallback high-res graphical banners (GhorerBazar style: 1000x400 / 2.5:1 desktop, 16:9 mobile)
const DEFAULT_SLIDES = [
  {
    id: 'def-1',
    title: 'Eid & Festive Family Matching Collection',
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=1500&h=600&auto=format&fit=crop',
    mobile_image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&h=338&auto=format&fit=crop',
    link_url: '/products',
  },
  {
    id: 'def-2',
    title: 'Joyful Kids & Baby Summer Wear',
    image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?q=80&w=1500&h=600&auto=format&fit=crop',
    mobile_image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?q=80&w=600&h=338&auto=format&fit=crop',
    link_url: '/products',
  },
  {
    id: 'def-3',
    title: 'Premium Organic Cotton Newborn Outfits',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1500&h=600&auto=format&fit=crop',
    mobile_image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&h=338&auto=format&fit=crop',
    link_url: '/products',
  },
];

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
        if (isMounted && data.length > 0) {
          setSlides(data);
        } else if (isMounted) {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (err) {
        console.warn('Hero sliders fetch notice, using fallback slides:', err.message);
        if (isMounted) setSlides(DEFAULT_SLIDES);
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
        <div className="w-full aspect-[2.5/1] max-h-[460px] rounded-xl sm:rounded-2xl lg:rounded-3xl bg-neutral-100 animate-pulse" />
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
