// Image URL Formatter - Mirrors Kids & Family Web Client formatImageUrl
import { MEDIA_BASE_URL, FALLBACK_PRODUCT_IMAGE } from '../constants/config';

export const formatImageUrl = (url, fallback = null) => {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  const mediaBase = MEDIA_BASE_URL.replace(/\/+$/, '');

  // Absolute URL pointing to external CDN/S3
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If backend serialized with localhost/127.0.0.1, replace with public media base
    if (trimmed.includes('127.0.0.1:8000') || trimmed.includes('localhost:8000')) {
      const cleanPath = trimmed.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, '');
      return mediaBase ? `${mediaBase}${cleanPath}` : cleanPath;
    }
    return trimmed;
  }

  // Extract from /media/
  const mediaIdx = trimmed.indexOf('/media/');
  if (mediaIdx !== -1) {
    const rel = trimmed.slice(mediaIdx);
    return `${mediaBase}${rel}`;
  }

  // Common upload folders
  if (
    trimmed.startsWith('variants/') ||
    trimmed.startsWith('sliders/') ||
    trimmed.startsWith('banners/') ||
    trimmed.startsWith('reviews/') ||
    trimmed.startsWith('products/')
  ) {
    return `${mediaBase}/media/${trimmed}`;
  }

  const rel = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${mediaBase}${rel}`;
};

export const formatProductImageUrl = (url) => {
  return formatImageUrl(url, FALLBACK_PRODUCT_IMAGE);
};
