/**
 * Format a number with commas as thousands separators
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Format a number as currency
 * @param num The number to format
 * @param currency The currency code (default: 'USD')
 * @param minimumFractionDigits Minimum fraction digits (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  num: number, 
  currency: string = 'USD', 
  minimumFractionDigits: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
  }).format(num);
};

/**
 * Format a number as a percentage
 * @param num The number to format (0-1)
 * @param minimumFractionDigits Minimum fraction digits (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  num: number, 
  minimumFractionDigits: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
  }).format(num);
};

/**
 * Format a date to a string
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions (default: { dateStyle: 'medium' })
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date, 
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string => {
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format a date and time to a string
 * @param date The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * @param str The string to truncate
 * @param maxLength Maximum length (default: 50)
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number = 50): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Format a wallet address by showing only the first and last few characters
 * @param address The wallet address to format
 * @param startChars Number of characters to show at the start (default: 6)
 * @param endChars Number of characters to show at the end (default: 4)
 * @returns Formatted wallet address
 */
export const formatWalletAddress = (
  address: string, 
  startChars: number = 6, 
  endChars: number = 4
): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
