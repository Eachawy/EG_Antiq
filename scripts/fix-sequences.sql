-- Fix Auto-Increment Sequences
-- This script fixes all auto-increment sequences in the database
-- Run this after bulk imports or manual data insertions to prevent unique constraint violations

-- Monument and reference data tables (all use integer auto-increment)
SELECT setval('monuments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM monuments));
SELECT setval('dynasty_id_seq', (SELECT COALESCE(MAX(id), 1) FROM dynasty));
SELECT setval('eras_id_seq', (SELECT COALESCE(MAX(id), 1) FROM eras));
SELECT setval('monuments_type_id_seq', (SELECT COALESCE(MAX(id), 1) FROM monuments_type));
SELECT setval('gallery_id_seq', (SELECT COALESCE(MAX(id), 1) FROM gallery));
SELECT setval('description_monuments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM description_monuments));
SELECT setval('monuments_era_id_seq', (SELECT COALESCE(MAX(id), 1) FROM monuments_era));

-- Note: Portal tables (favorites, browsing_history, etc.) use UUID primary keys, not sequences

-- Display results
SELECT
  'monuments' as table_name,
  (SELECT MAX(id) FROM monuments) as max_id,
  (SELECT last_value FROM monuments_id_seq) as seq_value
UNION ALL
SELECT
  'dynasty' as table_name,
  (SELECT MAX(id) FROM dynasty) as max_id,
  (SELECT last_value FROM dynasty_id_seq) as seq_value
UNION ALL
SELECT
  'eras' as table_name,
  (SELECT MAX(id) FROM eras) as max_id,
  (SELECT last_value FROM eras_id_seq) as seq_value
UNION ALL
SELECT
  'monuments_type' as table_name,
  (SELECT MAX(id) FROM monuments_type) as max_id,
  (SELECT last_value FROM monuments_type_id_seq) as seq_value
UNION ALL
SELECT
  'gallery' as table_name,
  (SELECT MAX(id) FROM gallery) as max_id,
  (SELECT last_value FROM gallery_id_seq) as seq_value
UNION ALL
SELECT
  'description_monuments' as table_name,
  (SELECT MAX(id) FROM description_monuments) as max_id,
  (SELECT last_value FROM description_monuments_id_seq) as seq_value
UNION ALL
SELECT
  'monuments_era' as table_name,
  (SELECT MAX(id) FROM monuments_era) as max_id,
  (SELECT last_value FROM monuments_era_id_seq) as seq_value
ORDER BY table_name;
