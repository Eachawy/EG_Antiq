# Monument API Guide

## Overview

The Monument APIs support complete CRUD operations with nested management of **galleries** and **description-monuments**. All endpoints require JWT authentication.

## Database Schema Changes

### New Relationships Added

1. **DescriptionMonument** → **Monument** relationship
   - Added `monumentsId` field to `description_monuments` table
   - Allows monument-specific descriptions instead of era/type/dynasty-based descriptions
   - Cascade delete: When a monument is deleted, its descriptions are also deleted

2. **Gallery** → **Monument** cascade delete
   - Updated Gallery foreign key to use `onDelete: Cascade`
   - Ensures galleries are automatically deleted when parent monument is deleted

## API Endpoints

### 1. Create Monument (with nested galleries and descriptions)

**Endpoint:** `POST /api/v1/monuments`

**Request Body:**
```json
{
  "monumentNameAr": "قصر المصمك",
  "monumentNameEn": "Al-Masmak Fort",
  "monumentBiographyAr": "قلعة من الطوب اللبن في وسط الرياض",
  "monumentBiographyEn": "A clay-brick fort in the center of Riyadh",
  "lat": "24.6308",
  "lng": "46.7143",
  "image": "masmak-fort.jpg",
  "mDate": "1895",
  "monumentsTypeId": 1,
  "eraId": 1,
  "dynastyId": 1,
  "zoom": "15",
  "center": "24.6308,46.7143",
  "galleries": [
    {
      "galleryPath": "/images/masmak-exterior.jpg"
    },
    {
      "galleryPath": "/images/masmak-interior.jpg"
    }
  ],
  "descriptions": [
    {
      "descriptionAr": "القصر كان مسرحا لمعركة فتح الرياض",
      "descriptionEn": "The fort was the site of the Battle of Riyadh"
    },
    {
      "descriptionAr": "يحتوي على متحف يعرض تاريخ المملكة",
      "descriptionEn": "Contains a museum displaying the history of the Kingdom"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "monumentNameAr": "قصر المصمك",
    "monumentNameEn": "Al-Masmak Fort",
    "...": "...",
    "galleries": [
      {
        "id": 1,
        "galleryPath": "/images/masmak-exterior.jpg",
        "monumentsId": 1,
        "...": "..."
      }
    ],
    "descriptionMonuments": [
      {
        "id": 1,
        "descriptionAr": "القصر كان مسرحا لمعركة فتح الرياض",
        "descriptionEn": "The fort was the site of the Battle of Riyadh",
        "monumentsId": 1,
        "...": "..."
      }
    ]
  },
  "message": "Monument created successfully"
}
```

**Notes:**
- `galleries` and `descriptions` arrays are optional
- If not provided for gallery/description items, `dynastyId`, `eraId`, and `monumentsTypeId` default to monument's values
- All items are created in a single transaction

---

### 2. Get Monument by ID (with nested data)

**Endpoint:** `GET /api/v1/monuments/:id`

**Response:**
```json
{
  "data": {
    "id": 1,
    "monumentNameAr": "قصر المصمك",
    "monumentNameEn": "Al-Masmak Fort",
    "...": "...",
    "monumentType": { ... },
    "era": { ... },
    "dynasty": { ... },
    "galleries": [ ... ],
    "descriptionMonuments": [ ... ]
  }
}
```

**Notes:**
- Returns monument with all nested relations
- Includes `monumentType`, `era`, `dynasty`, `galleries`, and `descriptionMonuments`

---

### 3. Update Monument (with nested operations)

**Endpoint:** `PATCH /api/v1/monuments/:id`

**Request Body:**
```json
{
  "monumentNameAr": "قصر المصمك التاريخي",
  "monumentNameEn": "Historic Al-Masmak Fort",
  "galleries": [
    {
      "id": 1,
      "galleryPath": "/images/masmak-exterior-updated.jpg"
    },
    {
      "galleryPath": "/images/masmak-courtyard.jpg"
    }
  ],
  "descriptions": [
    {
      "id": 1,
      "descriptionAr": "القصر كان مسرحا لمعركة فتح الرياض عام 1902",
      "descriptionEn": "The fort was the site of the Battle of Riyadh in 1902"
    },
    {
      "descriptionAr": "يضم القصر بوابة ضخمة من خشب الأثل",
      "descriptionEn": "The fort features a massive door made of tamarisk wood"
    }
  ]
}
```

**Update Behavior:**

**For Galleries/Descriptions:**
1. **Items with `id`** → Updated with new values
2. **Items without `id`** → Created as new entries
3. **Existing items not in array** → Deleted

**Example:**
If monument has galleries [1, 2, 3] and you send:
```json
{
  "galleries": [
    { "id": 1, "galleryPath": "/updated.jpg" },
    { "galleryPath": "/new.jpg" }
  ]
}
```

Result:
- Gallery 1: **UPDATED** with new path
- Gallery 2: **DELETED** (not in array)
- Gallery 3: **DELETED** (not in array)
- New gallery: **CREATED**

**Notes:**
- All updates happen in a single transaction
- If any operation fails, entire update is rolled back
- Partial updates are supported (only include fields you want to change)

---

### 4. Delete Monument (with cascade)

**Endpoint:** `DELETE /api/v1/monuments/:id`

**Response:**
```json
{
  "message": "Monument deleted successfully"
}
```

**Notes:**
- Automatically deletes all related galleries (CASCADE)
- Automatically deletes all related description-monuments (CASCADE)
- Returns 404 if monument doesn't exist

---

### 5. Get All Monuments

**Endpoint:** `GET /api/v1/monuments`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "monumentNameAr": "...",
      "monumentNameEn": "...",
      "monumentType": { ... },
      "era": { ... },
      "dynasty": { ... }
    }
  ],
  "meta": {
    "total": 10
  }
}
```

**Notes:**
- Does NOT include galleries or descriptionMonuments in list view
- Use GET /:id to get full details with nested data

---

## Authentication

All endpoints require JWT token in Authorization header:

```bash
curl -X GET http://localhost:3000/api/v1/monuments/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Get token by logging in:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Testing Examples

### Example 1: Create monument with 2 galleries and 2 descriptions
```bash
curl -X POST http://localhost:3000/api/v1/monuments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monumentNameAr": "الكعبة المشرفة",
    "monumentNameEn": "Kaaba",
    "monumentBiographyAr": "أقدس مكان في الإسلام",
    "monumentBiographyEn": "The most sacred place in Islam",
    "lat": "21.4225",
    "lng": "39.8262",
    "image": "kaaba.jpg",
    "mDate": "2000 BC",
    "monumentsTypeId": 2,
    "eraId": 3,
    "dynastyId": 5,
    "zoom": "18",
    "center": "21.4225,39.8262",
    "galleries": [
      {"galleryPath": "/images/kaaba-day.jpg"},
      {"galleryPath": "/images/kaaba-night.jpg"}
    ],
    "descriptions": [
      {
        "descriptionAr": "يطوف المسلمون حول الكعبة سبعة أشواط",
        "descriptionEn": "Muslims circumambulate the Kaaba seven times"
      },
      {
        "descriptionAr": "الكعبة مغطاة بالكسوة السوداء",
        "descriptionEn": "The Kaaba is covered with a black cloth"
      }
    ]
  }'
```

### Example 2: Update monument - modify 1 gallery, add 1 new, remove others
```bash
curl -X PATCH http://localhost:3000/api/v1/monuments/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "galleries": [
      {"id": 1, "galleryPath": "/images/kaaba-day-updated.jpg"},
      {"galleryPath": "/images/kaaba-dawn.jpg"}
    ]
  }'
```

### Example 3: Delete monument and all nested data
```bash
curl -X DELETE http://localhost:3000/api/v1/monuments/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## Implementation Details

### DTOs Created

1. **CreateMonumentDto** - Includes `galleries[]` and `descriptions[]` arrays
2. **UpdateMonumentDto** - Includes `galleries[]` and `descriptions[]` arrays
3. **CreateGalleryItemDto** - Individual gallery item schema
4. **CreateDescriptionItemDto** - Individual description item schema
5. **UpdateGalleryItemDto** - Individual gallery update schema (with optional `id`)
6. **UpdateDescriptionItemDto** - Individual description update schema (with optional `id`)

### Service Methods Enhanced

- **create()** - Uses Prisma nested create for galleries and descriptions
- **update()** - Uses $transaction for atomic updates with add/update/delete logic
- **findOne()** - Includes `descriptionMonuments` in the query
- **remove()** - Relies on CASCADE delete configured in schema

### Validation

- All DTOs use `class-validator` decorators
- Nested arrays use `@ValidateNested({ each: true })` and `@Type()` for transformation
- Global ValidationPipe has `transform: true` and `enableImplicitConversion: true`

---

## Migration Notes

### For Docker
After pulling changes, run:
```bash
docker exec backend-api npx prisma db push --skip-generate
```

### For Local
Already applied via:
```bash
npx prisma db push --skip-generate
npx prisma generate
```

---

## Error Handling

- **404 NOT_FOUND** - Monument doesn't exist
- **400 BAD_REQUEST** - Invalid data format or validation errors
- **401 UNAUTHORIZED** - Missing or invalid JWT token
- **500 INTERNAL_ERROR** - Database or server error (all shown in structured format with correlationId)
