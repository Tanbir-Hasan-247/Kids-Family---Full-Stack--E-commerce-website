// Kids & Family Mobile App - Configuration & Endpoints

export const API_BASE_URL = 'https://kids-family-backend-one.vercel.app/api';
export const MEDIA_BASE_URL = 'https://kids-family-backend-one.vercel.app';

// Local development URLs
export const LOCAL_EMULATOR_API = 'http://10.0.2.2:8000/api';
export const LOCAL_MEDIA_BASE = 'http://10.0.2.2:8000';

// Extended timeout to handle cold starts smoothly
export const TIMEOUT = 30000;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kf_access_token',
  REFRESH_TOKEN: 'kf_refresh_token',
  SESSION_KEY: 'kf_session_key',
  USER_DATA: 'kf_user_data',
};

export const DEFAULT_SETTINGS = {
  shop_name: 'Kids & Family',
  tagline: 'Premium Family Lifestyle & Outfits',
  address: 'Dhaka, Bangladesh',
  phone: '+880 1700-000000',
  email: 'support@kidsandfamily.com',
  whatsapp_number: '+880 1700-000000',
  opening_hours: '10 AM - 8 PM',
  delivery_inside_dhaka: 60,
  delivery_outside_dhaka: 120,
};

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop&q=80';
