// Shared utilities

// Format Naira amounts: ₦1,234,567
export const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });

// Currency symbol on its own
export const CURRENCY = '₦';
