# CSV Import Debugging Guide

## Issue: CSV Upload Not Reading Data

When uploading CSV files, all rows fail with:
```
Monument name (English and Arabic) is required
```

This means the CSV parser cannot read the column names or data correctly.

## Common Causes

### 1. **BOM (Byte Order Mark) Character**
Excel and some editors add an invisible BOM character at the start of UTF-8 files.

**Solution:** The code now automatically detects and removes BOM.

### 2. **Wrong Delimiter**
CSV might be using semicolons (;) instead of commas (,).

**Solution:** Ensure your CSV uses commas as delimiters.

### 3. **Column Name Mismatch**
Column headers must match exactly (case-sensitive):

**Required columns:**
- `monumentNameAr` (not `Monument Name Ar` or `monument_name_ar`)
- `monumentNameEn`
- `monumentBiographyAr`
- `monumentBiographyEn`
- `lat`
- `lng`
- `image`
- `startDate` (not `mDate`)
- `monumentsTypeId`
- `eraId`
- `dynastyId`
- `zoom`
- `center`

**Optional columns:**
- `endDate`
- `startDateHijri`
- `endDateHijri`
- `descriptionEn`
- `descriptionAr`

### 4. **Encoding Issues**
File must be UTF-8 encoded.

## Steps to Debug

### Step 1: Rebuild Production API with Debug Logging

```bash
# On production server
cd /path/to/EG_Antiq

# Pull latest changes
git pull origin main

# Rebuild
pnpm build

# Restart API
docker compose -f docker-compose.production.yml down api
docker compose -f docker-compose.production.yml up -d --build api
```

### Step 2: Try Upload Again

Upload your CSV file through the admin panel.

### Step 3: Check Logs for Debug Info

```bash
# Watch logs in real-time
docker compose -f docker-compose.production.yml logs -f api
```

You should now see detailed debug logs:
```json
{
  "message": "CSV columns detected",
  "columns": ["monumentNameAr", "monumentNameEn", "startDate", ...]
}
{
  "message": "First record sample",
  "monumentNameEn": "Karnak Temple",
  "monumentNameAr": "معبد الكرنك",
  "startDate": "2560 BC"
}
```

If the columns are wrong, you'll see:
```json
{
  "message": "Row 2 missing names. Available fields",
  "fields": ["Column1", "Column2", ...],
  "values": {"Column1": "value1", ...}
}
```

### Step 4: Fix Your CSV File

Based on the logs, fix your CSV file.

## Correct CSV Format

### Download Template from Admin Panel

1. Go to Monuments page
2. Click "Import CSV"
3. Click "Download CSV Template"
4. Use this as a reference

### Manual CSV Format

```csv
monumentNameAr,monumentNameEn,monumentBiographyAr,monumentBiographyEn,lat,lng,image,startDate,endDate,startDateHijri,endDateHijri,monumentsTypeId,eraId,dynastyId,zoom,center,descriptionEn,descriptionAr
معبد الكرنك,Karnak Temple,معبد الكرنك هو مجمع معابد ضخم,The Karnak Temple Complex,25.718833,32.657444,uploads/monuments/karnak.jpg,2560 BC,2540 BC,15/03/1446,20/05/1446,1,1,1,11,25.718833;32.657444,Temple description,وصف المعبد
```

**Important:**
- First row MUST be column headers
- Use commas (`,`) as separator
- No extra spaces in column names
- Use UTF-8 encoding
- Date fields can be any text format (e.g., "2560 BC", "2500-01-01")

## Testing CSV File

### Option 1: Use Online CSV Validator

1. Go to: https://csvlint.io/
2. Upload your CSV
3. Check for errors
4. Verify column names match exactly

### Option 2: Open in Text Editor

Open your CSV in a plain text editor (not Excel):
- **Windows:** Notepad++
- **Mac:** TextEdit (Plain Text mode)
- **Linux:** nano, vim, gedit

Check:
- First line has correct column names
- Columns separated by commas
- No weird characters at start (BOM)

### Option 3: Test with curl (Advanced)

```bash
# Save CSV to file
cat > test.csv << 'EOF'
monumentNameAr,monumentNameEn,monumentBiographyAr,monumentBiographyEn,lat,lng,image,startDate,endDate,startDateHijri,endDateHijri,monumentsTypeId,eraId,dynastyId,zoom,center,descriptionEn,descriptionAr
معبد تجريبي,Test Temple,سيرة تجريبية,Test biography,25.5,32.5,uploads/test.jpg,2500 BC,2480 BC,15/03/1446,20/05/1446,1,1,1,10,25.5;32.5,Test description,وصف تجريبي
EOF

# Get auth token (from admin login)
TOKEN="your_jwt_token_here"

# Upload
curl -X POST \
  http://localhost:3000/api/v1/monuments/import-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.csv"
```

## Common Excel Issues

### Issue: Excel Changes Format

Excel often:
- Converts dates automatically
- Adds semicolons instead of commas (in some locales)
- Adds BOM character
- Changes encoding

**Solution:**

1. **Don't use Excel to create CSV** - Use the template download from admin panel

2. **If you must use Excel:**
   - Save As → CSV UTF-8 (not regular CSV)
   - Check the file in a text editor after saving
   - Verify commas are used as separators

3. **Use Google Sheets instead:**
   - File → Download → Comma Separated Values (.csv)
   - More reliable than Excel

## Quick Fix Commands

### Remove BOM from CSV (Linux/Mac)

```bash
# Remove BOM
sed -i '1s/^\xEF\xBB\xBF//' your_file.csv

# Or using vim
vim -c 'set nobomb | wq' your_file.csv
```

### Convert Excel CSV to Standard CSV

```bash
# Install dos2unix
# Ubuntu/Debian: sudo apt-get install dos2unix
# Mac: brew install dos2unix

# Convert
dos2unix your_file.csv
```

### Check CSV Encoding

```bash
# Check file encoding
file -i your_file.csv

# Should output: text/csv; charset=utf-8
```

## If Problem Persists

### 1. Share Debug Logs

After trying upload, share the logs:
```bash
docker compose -f docker-compose.production.yml logs api | grep "CSV columns detected"
docker compose -f docker-compose.production.yml logs api | grep "missing names"
```

### 2. Share First Few Lines of CSV

```bash
head -3 your_file.csv
```

### 3. Check File in Hex Editor

Sometimes invisible characters cause issues:
```bash
# Show first 100 bytes in hex
xxd -l 100 your_file.csv
```

Look for:
- `ef bb bf` at start (BOM - now handled automatically)
- `3b` (semicolon) instead of `2c` (comma)

## Expected Behavior After Fix

After applying the debug code and rebuilding, when you upload CSV:

1. **In logs, you'll see:**
```json
{"message": "Starting CSV import with 5 records"}
{"message": "CSV columns detected", "columns": ["monumentNameAr", "monumentNameEn", ...]}
{"message": "First record sample", "monumentNameEn": "Karnak Temple", ...}
{"message": "Successfully imported monument 1: Karnak Temple"}
{"message": "Successfully imported monument 2: ..."}
```

2. **On success:**
```json
{
  "data": {
    "created": 5,
    "errors": 0,
    "total": 5,
    "errorDetails": []
  }
}
```

3. **On partial success:**
```json
{
  "data": {
    "created": 3,
    "errors": 2,
    "total": 5,
    "errorDetails": [
      "Row 3: Invalid monumentsTypeId: \"\" - must be a number",
      "Row 5: Monument name (English and Arabic) is required"
    ]
  }
}
```

## Summary

**Most common fix:** Download the CSV template from the admin panel and use that format exactly.

**Key points:**
- ✅ Use commas as separators
- ✅ UTF-8 encoding
- ✅ Exact column names (case-sensitive)
- ✅ First row must be headers
- ✅ New format uses `startDate` not `mDate`
