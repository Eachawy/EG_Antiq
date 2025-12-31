# Database Maintenance Scripts

## fix-sequences.sql

### Purpose
Fixes PostgreSQL auto-increment sequences that have become out of sync with the actual data in tables.

### When to Use
Run this script when you encounter errors like:
- `Unique constraint failed on the fields: (id)` when creating new records
- Auto-increment sequences are behind the actual maximum ID values in tables

This typically happens when:
- Data was manually inserted with specific IDs
- Bulk data was imported without updating sequences
- Rows were deleted and the sequence wasn't adjusted

### How to Run

```bash
# From the project root
PGPASSWORD=Antiq_dev psql -h localhost -p 5433 -U postgres -d Antiq_db -f scripts/fix-sequences.sql
```

Or using pnpm (if you add this as a script to package.json):

```bash
pnpm db:fix-sequences
```

### What It Does
The script resets all auto-increment sequences for monument-related tables to match the maximum ID in each table:

- `monuments` - Main monuments table
- `dynasty` - Dynasty reference data
- `eras` - Era reference data
- `monuments_type` - Monument type reference data
- `gallery` - Monument gallery images
- `description_monuments` - Monument descriptions
- `monuments_era` - Monument-era relationships

After running, the script displays a verification table showing the max ID and sequence value for each table.

### Expected Output
```
      table_name       | max_id | seq_value
-----------------------+--------+-----------
 description_monuments |      5 |         5
 dynasty               |     45 |        45
 eras                  |      5 |         5
 gallery               |     11 |        11
 monuments             |      9 |         9
 monuments_era         |      1 |         1
 monuments_type        |     16 |        16
```

The `seq_value` should be equal to or greater than `max_id` for proper operation.

### Notes
- Portal tables (favorites, browsing_history, saved_searches, etc.) use UUID primary keys and don't need sequence fixes
- This script is safe to run multiple times
- Running this script does not affect existing data
