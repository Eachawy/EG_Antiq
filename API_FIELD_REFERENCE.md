# API Field Reference for Frontend Integration

## Monument Object Structure

When fetching monuments from `GET /api/v1/monuments`, the API returns the following structure:

### Top-Level Monument Fields

```json
{
  "id": 10,
  "monumentNameAr": "معبد أبو سمبل",           // Monument name in Arabic
  "monumentNameEn": "Abu Simbel Temple",       // Monument name in English
  "monumentBiographyAr": "...",                // Biography in Arabic
  "monumentBiographyEn": "...",                // Biography in English
  "lat": "22.337222",                          // Latitude (string)
  "lng": "31.625833",                          // Longitude (string)
  "image": "/images/abu-simbel.jpg",           // Main image path
  "mDate": "31/12/2025",                       // Monument date
  "monumentsTypeId": 1,                        // Foreign key to monument type
  "eraId": 1,                                  // Foreign key to era
  "dynastyId": 1,                              // Foreign key to dynasty
  "zoom": "12",                                // Map zoom level
  "center": "22.337222,31.625833",             // Map center coordinates
  "createdAt": "2025-12-31T13:08:50.890Z"      // Creation timestamp
}
```

### Nested Related Objects

The API includes related objects with the following structure:

#### monumentType
```json
"monumentType": {
  "id": 1,
  "nameAr": "العواصم",           // Type name in Arabic
  "nameEn": "Capital Cities",    // Type name in English
  "createdAt": "..."
}
```

#### era
```json
"era": {
  "id": 1,
  "nameAr": "الفرعونية",         // Era name in Arabic
  "nameEn": "Pharaonic",         // Era name in English
  "dateFrom": "5500 BC",
  "dateTo": "332 BC",
  "hijriFrom": "-",
  "hijriTo": "-",
  "createdAt": "..."
}
```

#### dynasty
```json
"dynasty": {
  "id": 1,
  "nameAr": "ما قبل الأسرات",    // Dynasty name in Arabic
  "nameEn": "pre dynastic",      // Dynasty name in English
  "eraId": 1,
  "dateFrom": "5500 BC",
  "dateTo": "3100 BC",
  "hijriFrom": "-",
  "hijriTo": "-",
  "createdAt": "..."
}
```

## Common Frontend Table Mappings

If your admin panel table is showing "-" for values, check that your column definitions map to the correct field names:

### ❌ WRONG Field Names (will show "-")
```javascript
// These field names don't exist in the API response
{
  columns: [
    { field: 'name' },           // ❌ Should be 'monumentNameEn' or 'monumentNameAr'
    { field: 'biography' },       // ❌ Should be 'monumentBiographyEn' or 'monumentBiographyAr'
    { field: 'latitude' },        // ❌ Should be 'lat'
    { field: 'longitude' },       // ❌ Should be 'lng'
    { field: 'date' },            // ❌ Should be 'mDate'
    { field: 'type' },            // ❌ Should be 'monumentType.nameEn'
    { field: 'typeId' },          // ❌ Should be 'monumentsTypeId'
  ]
}
```

### ✅ CORRECT Field Names
```javascript
// For English admin panel
{
  columns: [
    { field: 'monumentNameEn', header: 'Name' },
    { field: 'monumentBiographyEn', header: 'Biography' },
    { field: 'lat', header: 'Latitude' },
    { field: 'lng', header: 'Longitude' },
    { field: 'mDate', header: 'Date' },
    { field: 'monumentType.nameEn', header: 'Type' },           // Nested field
    { field: 'era.nameEn', header: 'Era' },                     // Nested field
    { field: 'dynasty.nameEn', header: 'Dynasty' },             // Nested field
    { field: 'monumentsTypeId', header: 'Type ID' },
    { field: 'eraId', header: 'Era ID' },
    { field: 'dynastyId', header: 'Dynasty ID' },
  ]
}
```

### ✅ For Arabic admin panel
```javascript
{
  columns: [
    { field: 'monumentNameAr', header: 'الاسم' },
    { field: 'monumentBiographyAr', header: 'السيرة' },
    { field: 'monumentType.nameAr', header: 'النوع' },
    { field: 'era.nameAr', header: 'العصر' },
    { field: 'dynasty.nameAr', header: 'الأسرة' },
  ]
}
```

## Framework-Specific Examples

### React Table / TanStack Table
```typescript
const columns = [
  {
    accessorKey: 'monumentNameEn',
    header: 'Monument Name',
  },
  {
    accessorKey: 'monumentType.nameEn',
    header: 'Type',
  },
  {
    accessorKey: 'era.nameEn',
    header: 'Era',
  },
];
```

### PrimeNG (Angular)
```typescript
<p-table [value]="monuments">
  <ng-template pTemplate="header">
    <tr>
      <th>Monument Name</th>
      <th>Type</th>
      <th>Era</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-monument>
    <tr>
      <td>{{ monument.monumentNameEn }}</td>
      <td>{{ monument.monumentType?.nameEn }}</td>
      <td>{{ monument.era?.nameEn }}</td>
    </tr>
  </ng-template>
</p-table>
```

### Element Plus (Vue)
```vue
<el-table :data="monuments">
  <el-table-column prop="monumentNameEn" label="Monument Name" />
  <el-table-column label="Type">
    <template #default="{ row }">
      {{ row.monumentType?.nameEn }}
    </template>
  </el-table-column>
  <el-table-column label="Era">
    <template #default="{ row }">
      {{ row.era?.nameEn }}
    </template>
  </el-table-column>
</el-table>
```

## API Endpoints

- **GET** `/api/v1/monuments` - Get all monuments with related data
- **GET** `/api/v1/monuments/:id` - Get single monument with galleries and descriptions
- **POST** `/api/v1/monuments` - Create new monument
- **PATCH** `/api/v1/monuments/:id` - Update monument
- **DELETE** `/api/v1/monuments/:id` - Delete monument

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.
