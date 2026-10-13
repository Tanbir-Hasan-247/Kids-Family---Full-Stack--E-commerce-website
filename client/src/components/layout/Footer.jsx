import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Heart } from 'lucide-react';
import { useShopSettings } from '../../context/ShopSettingsContext';

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YoutubeIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Footer = () => {
  const { settings } = useShopSettings();

  const phone = settings?.phone || '+880 1700-000000';
  const email = settings?.email || 'support@kidsandfamily.com';
  const address = settings?.address || 'Dhaka, Bangladesh';
  const openingHours = settings?.opening_hours || '10 AM - 8 PM';
  const aboutText =
    settings?.footer_about ||
    'Premium clothing & festive collections crafted for kids, men, and women. Celebrating every special family moment with quality, elegance, and comfort.';

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-14 pb-8 mt-20 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <span className="text-2xl font-black tracking-tight text-white">
              {settings?.shop_name ? (
                settings.shop_name
              ) : (
                <>
                  KIDS<span className="text-amber-500">&</span>FAMILY
                </>
              )}
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">
              {aboutText}
            </p>
            <div className="pt-2 text-xs space-y-2 text-neutral-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-amber-400 transition">
                  {phone} {openingHours ? `(${openingHours})` : ''}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-amber-400 transition">
                  {email}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            </div>

            {/* Social Icons if provided */}
            {(settings?.facebook_url || settings?.instagram_url || settings?.youtube_url) && (
              <div className="flex items-center gap-3 pt-1">
                {settings.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-[#1877F2] text-neutral-400 hover:text-white flex items-center justify-center transition"
                    title="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                )}
                {settings.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-[#E4405F] text-neutral-400 hover:text-white flex items-center justify-center transition"
                    title="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {settings.youtube_url && (
                  <a
                    href={settings.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-[#FF0000] text-neutral-400 hover:text-white flex items-center justify-center transition"
                    title="YouTube"
                  >
                    <YoutubeIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Shop */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explore Collections
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link to="/products?cat=panjabi-and-koti" className="hover:text-amber-400 transition">
                  Panjabi & Koti Sets
                </Link>
              </li>
              <li>
                <Link to="/products?cat=frock-and-dress" className="hover:text-amber-400 transition">
                  Girls Floral Frocks
                </Link>
              </li>
              <li>
                <Link to="/products?cat=t-shirt-and-polo" className="hover:text-amber-400 transition">
                  Boys Graphic Tees
                </Link>
              </li>
              <li>
                <Link to="/products?cat=kurti-and-tops" className="hover:text-amber-400 transition">
                  Women's Kurtis & Tops
                </Link>
              </li>
              <li>
                <Link to="/sale" className="text-rose-400 hover:text-rose-300 font-semibold transition">
                  Exclusive Sale & Discounts
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link to="/cart" className="hover:text-amber-400 transition">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-amber-400 transition">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-400 transition">
                  Track Your Order
                </Link>
              </li>
              <li>
                <span className="text-neutral-500">Cash on Delivery Policy</span>
              </li>
              <li>
                <span className="text-neutral-500">7-Day Easy Exchange</span>
              </li>
            </ul>
          </div>

          {/* Perks */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Why Shop With Us
            </h4>
            <div className="bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-700/50 space-y-1.5">
              <span className="text-xs font-semibold text-amber-400">⚡ Fast Nationwide Delivery</span>
              <p className="text-[11px] text-neutral-400 leading-snug">
                Express doorstep delivery in Dhaka (24-48 hours) and nationwide (3-5 days).
              </p>
            </div>
            <div className="bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-700/50 space-y-1.5">
              <span className="text-xs font-semibold text-emerald-400">🛡️ 100% Authentic Quality</span>
              <p className="text-[11px] text-neutral-400 leading-snug">
                Breathable fabrics crafted with skin-friendly care for kids and adults.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} KIDS & FAMILY Lifestyle Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for joyful families
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

