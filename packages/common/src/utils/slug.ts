/**
 * Slug generation utilities for monument URLs
 * Supports both English and Arabic (transliterated) slugs
 */

import transliterate from '@sindresorhus/transliterate';
import { slugify } from './string';

// PrismaClient type import - for type safety in ensureUniqueSlug
type PrismaClient = any; // Will be properly typed when used with actual Prisma client

/**
 * Generate English slug from English text
 * Uses existing slugify() function from string.ts
 *
 * @example
 * generateEnglishSlug('Al-Masmak Fort') // 'al-masmak-fort'
 * generateEnglishSlug('Temple of Karnak') // 'temple-of-karnak'
 */
export function generateEnglishSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return slugify(text);
}

/**
 * Generate Arabic slug by transliterating Arabic text to Latin alphabet
 * Uses @sindresorhus/transliterate for Arabic → Latin conversion
 *
 * @example
 * generateArabicSlug('قصر المصمك') // 'qsr-almsmk' (or similar)
 * generateArabicSlug('معبد الكرنك') // 'maebd-alkrnk' (or similar)
 */
export function generateArabicSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Transliterate Arabic to Latin
  const transliterated = transliterate(text);

  // Apply slugification to the transliterated text
  return slugify(transliterated);
}

/**
 * Generate both English and Arabic slugs for a monument
 *
 * @param monumentNameEn - Monument name in English
 * @param monumentNameAr - Monument name in Arabic
 * @returns Object with slugEn and slugAr
 *
 * @example
 * generateMonumentSlugs('Al-Masmak Fort', 'قصر المصمك')
 * // { slugEn: 'al-masmak-fort', slugAr: 'qsr-almsmk' }
 */
export function generateMonumentSlugs(
  monumentNameEn: string,
  monumentNameAr: string
): { slugEn: string; slugAr: string } {
  return {
    slugEn: generateEnglishSlug(monumentNameEn),
    slugAr: generateArabicSlug(monumentNameAr),
  };
}

/**
 * Ensure slug uniqueness by checking database and appending number if collision
 *
 * @param baseSlug - The base slug to check
 * @param lang - Language of the slug ('en' or 'ar')
 * @param existingMonumentId - Optional monument ID (for updates, to exclude self from collision check)
 * @param prisma - Prisma client instance
 * @returns Unique slug (with numeric suffix if needed)
 *
 * @example
 * // No collision
 * await ensureUniqueSlug('temple-of-karnak', 'en', undefined, prisma) // 'temple-of-karnak'
 *
 * // Collision - returns with suffix
 * await ensureUniqueSlug('temple', 'en', undefined, prisma) // 'temple-2'
 *
 * // Updating same monument - no suffix needed
 * await ensureUniqueSlug('temple', 'en', 42, prisma) // 'temple' (if monument 42 already has this slug)
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  lang: 'en' | 'ar',
  existingMonumentId: number | undefined,
  prisma: PrismaClient
): Promise<string> {
  if (!baseSlug) {
    return '';
  }

  const slugField = lang === 'en' ? 'slugEn' : 'slugAr';

  // Check if slug exists (excluding the monument being updated)
  const where: any = {
    [slugField]: baseSlug,
  };

  if (existingMonumentId !== undefined) {
    where.id = { not: existingMonumentId };
  }

  const existing = await prisma.monument.findFirst({ where });

  // If no collision, return original slug
  if (!existing) {
    return baseSlug;
  }

  // Collision detected - find next available number suffix
  let counter = 2;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (true) {
    const whereCandidate: any = {
      [slugField]: candidateSlug,
    };

    if (existingMonumentId !== undefined) {
      whereCandidate.id = { not: existingMonumentId };
    }

    const existingCandidate = await prisma.monument.findFirst({
      where: whereCandidate,
    });

    if (!existingCandidate) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${baseSlug}-${counter}`;

    // Safety limit to prevent infinite loops
    if (counter > 1000) {
      throw new Error(`Unable to generate unique slug for: ${baseSlug}`);
    }
  }
}

/**
 * Build monument URL with ID-slug format
 *
 * @param id - Monument ID
 * @param slug - Monument slug
 * @param lang - Language ('en' or 'ar')
 * @param baseUrl - Optional base URL (e.g., 'https://kemetra.org')
 * @returns Full monument URL
 *
 * @example
 * buildMonumentUrl(21, 'al-masmak-fort', 'en')
 * // '/en/sites/21-al-masmak-fort'
 *
 * buildMonumentUrl(21, 'al-masmak-fort', 'en', 'https://kemetra.org')
 * // 'https://kemetra.org/en/sites/21-al-masmak-fort'
 *
 * buildMonumentUrl(21, '', 'en')
 * // '/en/sites/21' (falls back to ID-only if slug missing)
 */
export function buildMonumentUrl(
  id: number,
  slug: string,
  lang: 'en' | 'ar' = 'en',
  baseUrl?: string
): string {
  if (!id || isNaN(id) || id <= 0) {
    throw new Error('Invalid monument ID');
  }

  const urlPath = slug
    ? `/${lang}/sites/${id}-${slug}`
    : `/${lang}/sites/${id}`;

  return baseUrl ? `${baseUrl}${urlPath}` : urlPath;
}

/**
 * Parse monument URL to extract ID and optional slug
 * Supports both formats: '/sites/21' and '/sites/21-slug'
 *
 * @param urlPath - URL path or just the ID portion
 * @returns Object with id and optional slug
 *
 * @example
 * parseMonumentUrl('21') // { id: 21 }
 * parseMonumentUrl('21-al-masmak-fort') // { id: 21, slug: 'al-masmak-fort' }
 * parseMonumentUrl('/en/sites/21-slug') // { id: 21, slug: 'slug' }
 * parseMonumentUrl('invalid') // throws Error
 */
export function parseMonumentUrl(urlPath: string): { id: number; slug?: string } {
  if (!urlPath || typeof urlPath !== 'string') {
    throw new Error('Invalid URL path');
  }

  // Extract just the ID-slug portion if full path provided
  // e.g., '/en/sites/21-slug' -> '21-slug'
  let idSlugPart = urlPath.trim();

  if (idSlugPart.includes('/sites/')) {
    const parts = idSlugPart.split('/sites/');
    idSlugPart = parts[parts.length - 1];
  }

  // Split by first hyphen to separate ID from slug
  // '21-al-masmak-fort' -> ['21', 'al-masmak-fort']
  const firstHyphenIndex = idSlugPart.indexOf('-');

  let idPart: string;
  let slugPart: string | undefined;

  if (firstHyphenIndex === -1) {
    // No hyphen - just ID
    idPart = idSlugPart;
  } else {
    // Has hyphen - split ID and slug
    idPart = idSlugPart.substring(0, firstHyphenIndex);
    slugPart = idSlugPart.substring(firstHyphenIndex + 1);
  }

  // Parse ID
  const id = parseInt(idPart, 10);

  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid monument ID: ${idPart}`);
  }

  return {
    id,
    ...(slugPart && { slug: slugPart }),
  };
}
