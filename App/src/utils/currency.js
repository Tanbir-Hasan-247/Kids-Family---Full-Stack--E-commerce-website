// Price and Currency Helpers for Bangladeshi Taka (৳)

export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '৳0';
  }
  const num = Number(amount);
  return `৳${Math.round(num)}`;
};

export const formatPriceWithDecimals = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '৳0.00';
  }
  const num = Number(amount);
  return `৳${num.toFixed(2)}`;
};

export const calculateDiscountPercent = (comparePrice, currentPrice) => {
  const orig = Number(comparePrice);
  const curr = Number(currentPrice);
  if (!orig || !curr || orig <= curr) return 0;
  return Math.round(((orig - curr) / orig) * 100);
};
