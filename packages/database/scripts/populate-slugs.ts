/**
 * Data migration script to populate slugs for existing monuments
 *
 * This script:
 * 1. Fetches all monuments without slugs
 * 2. Generates English and Arabic slugs
 * 3. Ensures uniqueness by appending numbers if needed
 * 4. Updates monuments in batches
 *
 * Run with: pnpm prisma:populate-slugs
 */

import { PrismaClient } from '@prisma/client';
import { generateMonumentSlugs, ensureUniqueSlug } from '../../../packages/common/src/utils/slug';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting slug population for monuments...\n');

  // Fetch all monuments without slugs
  const monuments = await prisma.monument.findMany({
    where: {
      OR: [
        { slugEn: null },
        { slugAr: null },
      ],
    },
    select: {
      id: true,
      monumentNameEn: true,
      monumentNameAr: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`📊 Found ${monuments.length} monuments without slugs\n`);

  if (monuments.length === 0) {
    console.log('✅ All monuments already have slugs. Nothing to do!\n');
    return;
  }

  let updated = 0;
  let errors = 0;
  const BATCH_LOG_INTERVAL = 10;

  for (const monument of monuments) {
    try {
      // Generate base slugs from monument names
      const { slugEn, slugAr } = generateMonumentSlugs(
        monument.monumentNameEn,
        monument.monumentNameAr
      );

      // Ensure uniqueness (handles collisions)
      const finalSlugEn = await ensureUniqueSlug(
        slugEn,
        'en',
        monument.id,
        prisma
      );

      const finalSlugAr = await ensureUniqueSlug(
        slugAr,
        'ar',
        monument.id,
        prisma
      );

      // Update monument with slugs
      await prisma.monument.update({
        where: { id: monument.id },
        data: {
          slugEn: finalSlugEn,
          slugAr: finalSlugAr,
        },
      });

      updated++;

      // Log progress every N monuments
      if (updated % BATCH_LOG_INTERVAL === 0) {
        console.log(`   ⏳ Processed ${updated}/${monuments.length} monuments...`);
      }

      // Log individual monument with slugs (first few)
      if (updated <= 5) {
        console.log(`   ✓ Monument #${monument.id}: "${monument.monumentNameEn}"`);
        console.log(`     EN: ${finalSlugEn}`);
        console.log(`     AR: ${finalSlugAr}\n`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Error processing monument #${monument.id}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Slug population complete!`);
  console.log(`   • Total monuments processed: ${monuments.length}`);
  console.log(`   • Successfully updated: ${updated}`);
  console.log(`   • Errors: ${errors}`);
  console.log('='.repeat(60) + '\n');

  if (errors > 0) {
    console.log('⚠️  Some monuments failed to update. Review errors above.');
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error during slug population:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
