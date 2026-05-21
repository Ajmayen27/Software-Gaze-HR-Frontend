/**
 * Format a number as BDT currency
 * @param {number} amount
 * @param {boolean} showSymbol - whether to show ৳ symbol
 * @returns {string}
 */
export const formatBDT = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return '—';
  const formatted = Number(amount).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return showSymbol ? `৳ ${formatted}` : formatted;
};

/**
 * Format a number as compact BDT (e.g., 53K, 1.2L)
 */
export const formatBDTCompact = (amount) => {
  if (!amount) return '—';
  if (amount >= 10000000) return `৳ ${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `৳ ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `৳ ${(amount / 1000).toFixed(1)}K`;
  return `৳ ${amount}`;
};
