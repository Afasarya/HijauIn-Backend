/**
 * Format number to Indonesian Rupiah currency
 * @param amount - The amount to format
 * @returns Formatted string in IDR format (e.g., "Rp 25.000")
 */
export function formatToRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separator only (no currency symbol)
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "25.000")
 */
export function formatWithThousandSeparator(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}
