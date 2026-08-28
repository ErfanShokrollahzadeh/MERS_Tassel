export const STORE_CURRENCY = 'TRY' as const;

export function formatMoney(
  amount: number,
  locale: 'en' | 'tr' = 'tr',
  options: Intl.NumberFormatOptions = {},
) {
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  const minimumFractionDigits = options.minimumFractionDigits
    ?? (Number.isInteger(amount) ? 0 : Math.min(2, maximumFractionDigits));
  const value = new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', {
    minimumFractionDigits,
    maximumFractionDigits,
    ...options,
  }).format(amount);

  return `${value} TL`;
}
