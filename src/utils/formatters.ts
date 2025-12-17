/**
 * Centralized formatting utilities for SAM application
 * Provides consistent number, currency, percentage, and date formatting
 */

export interface FormatCurrencyOptions {
  /**
   * How to handle decimal places:
   * - 'auto': Show decimals only if non-zero fractional part (default)
   * - 'always': Always show 2 decimal places
   * - 'never': Never show decimals (round to integer)
   */
  decimals?: 'auto' | 'always' | 'never';

  /**
   * Locale for number formatting (default: 'en-US')
   */
  locale?: string;

  /**
   * Currency symbol to prepend (optional)
   */
  currencySymbol?: string;

  /**
   * Show sign for positive numbers (e.g., "+1,000")
   */
  showPositiveSign?: boolean;
}

/**
 * Format a number as currency with smart decimal handling and thousand separators
 *
 * Examples:
 *   formatCurrency(1000) → "1,000"
 *   formatCurrency(1000.50) → "1,000.50"
 *   formatCurrency(1234.567) → "1,234.57"
 *   formatCurrency(1000, { decimals: 'always' }) → "1,000.00"
 *   formatCurrency(1000.99, { decimals: 'never' }) → "1,001"
 */
export function formatCurrency(
  amount: number | undefined | null,
  options: FormatCurrencyOptions = {}
): string {
  // Handle null/undefined/NaN
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '-';
  }

  const {
    decimals = 'auto',
    locale = 'en-US',
    currencySymbol,
    showPositiveSign = false
  } = options;

  // Determine decimal places based on mode
  let minDecimals = 0;
  let maxDecimals = 0;

  if (decimals === 'always') {
    minDecimals = 2;
    maxDecimals = 2;
  } else if (decimals === 'auto') {
    // Check if there's a meaningful fractional part (more than floating point noise)
    const hasDecimals = Math.abs(amount % 1) > 0.001;
    minDecimals = 0;
    maxDecimals = hasDecimals ? 2 : 0;
  } else {
    // 'never'
    minDecimals = 0;
    maxDecimals = 0;
  }

  // Format the number with thousand separators
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(amount);

  // Add positive sign if requested
  const signedFormatted = showPositiveSign && amount > 0 ? `+${formatted}` : formatted;

  // Add currency symbol if provided
  return currencySymbol ? `${currencySymbol}${signedFormatted}` : signedFormatted;
}

/**
 * Format a number for display in tables/grids (same as formatCurrency but with cleaner defaults)
 * Always shows thousand separators, smart decimal handling
 */
export function formatNumber(
  value: number | undefined | null,
  options: FormatCurrencyOptions = {}
): string {
  return formatCurrency(value, options);
}

/**
 * Format a percentage value
 *
 * Examples:
 *   formatPercentage(15) → "15%"
 *   formatPercentage(15.5) → "15.5%"
 *   formatPercentage(15.567) → "15.57%"
 *   formatPercentage(15, 0) → "15%"
 */
export function formatPercentage(
  value: number | undefined | null,
  maxDecimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }

  // Smart decimal handling - only show decimals if non-zero
  const hasDecimals = Math.abs(value % 1) > 0.001;
  const decimalsToShow = hasDecimals ? Math.min(maxDecimals, 2) : 0;

  return `${value.toFixed(decimalsToShow)}%`;
}

/**
 * Format a date string for display
 *
 * Examples:
 *   formatDate('2025-01-15') → "15 Jan 2025"
 *   formatDate('2025-01-15', 'long') → "January 15, 2025"
 *   formatDate('2025-01-15', 'numeric') → "01/15/2025"
 */
export function formatDate(
  dateString: string | Date | undefined | null,
  format: string | 'short' | 'long' | 'numeric' = 'short'
): string {
  if (!dateString || dateString === '-') return '-';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '-';

    // Handle predefined formats
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'numeric':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      default:
        // Custom format - simple implementation for 'dd MMM yyyy HH:mm'
        if (format === 'dd MMM yyyy HH:mm') {
          const day = date.getDate().toString().padStart(2, '0');
          const month = date.toLocaleDateString('en-GB', { month: 'short' });
          const year = date.getFullYear();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${day} ${month} ${year} ${hours}:${minutes}`;
        }
        return date.toLocaleDateString();
    }
  } catch (error) {
    return '-';
  }
}

/**
 * Format a number for input field display
 * Removes unnecessary trailing zeros but keeps precision when needed
 *
 * Examples:
 *   formatInputValue(10.00) → "10"
 *   formatInputValue(10.50) → "10.5"
 *   formatInputValue(10.567, 2) → "10.57"
 */
export function formatInputValue(
  value: number | undefined | null,
  maxDecimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  // Round to max decimals first
  const rounded = Math.round(value * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);

  // Convert to string and remove trailing zeros
  const str = rounded.toFixed(maxDecimals);

  // Remove trailing zeros after decimal point, but keep at least one decimal if needed
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '');
  }

  return str;
}

/**
 * Parse a formatted currency string back to a number
 *
 * Examples:
 *   parseCurrency("1,234.56") → 1234.56
 *   parseCurrency("$1,234") → 1234
 *   parseCurrency("-1,000.50") → -1000.50
 */
export function parseCurrency(formattedValue: string): number {
  if (!formattedValue) return 0;

  // Remove currency symbols, commas, and whitespace
  const cleaned = formattedValue
    .replace(/[^0-9.-]/g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a quantity value (supports fractional quantities)
 *
 * Examples:
 *   formatQuantity(100) → "100"
 *   formatQuantity(100.5) → "100.5"
 *   formatQuantity(100.567) → "100.57"
 */
export function formatQuantity(
  value: number | undefined | null,
  maxDecimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  const hasDecimals = Math.abs(value % 1) > 0.001;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasDecimals ? maxDecimals : 0,
  }).format(value);
}
