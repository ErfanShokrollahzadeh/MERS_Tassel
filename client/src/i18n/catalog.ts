import type { Locale } from '@/i18n/I18nProvider';
import type { Category, Product, ProductVariant } from '@/types/commerce';

/**
 * Localization now travels on the records themselves.
 *
 * This module used to hold a hand-maintained map keyed by product slug, which meant any
 * product created in the admin panel silently fell back to English forever. The API returns
 * `*Tr` fields instead, so these helpers only choose between what the record already carries.
 */

const pick = (english: string, turkish: string | null | undefined, locale: Locale) =>
  locale === 'tr' && turkish ? turkish : english;

export type LocalizedProduct = {
  name: string;
  description: string;
  story: string;
  material: string;
  dimensions: string;
  category: string;
};

export function productCopy(product: Product, locale: Locale): LocalizedProduct {
  return {
    name: pick(product.name, product.nameTr, locale),
    description: pick(product.description, product.descriptionTr, locale),
    story: pick(product.story, product.storyTr, locale),
    material: pick(product.material, product.materialTr, locale),
    dimensions: pick(product.dimensions, product.dimensionsTr, locale),
    category: pick(product.category, product.categoryTr, locale),
  };
}

export function categoryName(category: Pick<Category, 'name' | 'nameTr'>, locale: Locale) {
  return pick(category.name, category.nameTr, locale);
}

export function categoryDescription(category: Pick<Category, 'description' | 'descriptionTr'>, locale: Locale) {
  return pick(category.description, category.descriptionTr, locale);
}

/**
 * Resolves a colour's display name from the product's variants. Falls back to the raw value
 * so a colour with no translation still renders instead of disappearing.
 */
export function colorName(color: string, variants: ProductVariant[], locale: Locale) {
  const variant = variants.find((candidate) => candidate.color === color);
  return pick(color, variant?.colorTr, locale);
}

/** Swatch colour comes from the variant record; neutral grey when unset. */
export function colorSwatch(color: string, variants: ProductVariant[]) {
  return variants.find((candidate) => candidate.color === color)?.swatchHex || '#8c8186';
}
