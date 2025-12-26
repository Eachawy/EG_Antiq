# Implementation Plan: E-Commerce & Tour Guides System

## Overview
Add 5 new feature modules to the Ancient Egypt API based on dark_theme UI mockups:
1. **Books** - E-commerce catalog with reviews
2. **Shopping Cart** - Cart management for books
3. **Tour Guides** - Guide profiles with contact/inquiry system
4. **Favorites** - User's favorite monuments
5. **Saved Searches** - Save monument search queries

## Requirements Summary
- **Tour Guides**: Contact/inquiry only (no full booking system with payments)
- **E-commerce**: Shipping address management required
- **Saved Searches**: Monuments/sites only (not books)
- Follow existing NestJS patterns (Controllers → Services → Prisma)
- Use JWT authentication with `@Public()` decorator for public endpoints

---

## Phase 1: Database Schema Migration

### File: `apps/api/prisma/schema.prisma`

Add the following models:

### 1.1 Books Domain
```prisma
model BookCategory {
  id        Int       @id @default(autoincrement())
  nameAr    String    @map("name_ar") @db.VarChar(100)
  nameEn    String    @map("name_en") @db.VarChar(100)
  slug      String    @unique @db.VarChar(100)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  books     Book[]
  @@map("book_categories")
}

model Book {
  id             Int       @id @default(autoincrement())
  titleAr        String    @map("title_ar") @db.VarChar(255)
  titleEn        String    @map("title_en") @db.VarChar(255)
  authorAr       String    @map("author_ar") @db.VarChar(255)
  authorEn       String    @map("author_en") @db.VarChar(255)
  descriptionAr  String    @map("description_ar") @db.Text
  descriptionEn  String    @map("description_en") @db.Text
  isbn           String?   @unique @db.VarChar(20)
  publisher      String    @db.VarChar(255)
  publishYear    Int       @map("publish_year")
  language       String    @db.VarChar(50)
  pages          Int
  price          Decimal   @db.Decimal(10, 2)
  discountPrice  Decimal?  @map("discount_price") @db.Decimal(10, 2)
  coverImage     String    @map("cover_image") @db.VarChar(500)
  stockQuantity  Int       @map("stock_quantity") @default(0)
  rating         Decimal?  @db.Decimal(3, 2)
  reviewCount    Int       @default(0) @map("review_count")
  categoryId     Int       @map("category_id")
  isActive       Boolean   @default(true) @map("is_active")
  isFeatured     Boolean   @default(false) @map("is_featured")
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  category      BookCategory @relation(fields: [categoryId], references: [id])
  cartItems     CartItem[]
  orderItems    OrderItem[]
  reviews       BookReview[]

  @@index([categoryId])
  @@index([isActive, isFeatured])
  @@map("books")
}

model BookReview {
  id        String   @id @default(uuid()) @db.Uuid
  bookId    Int      @map("book_id")
  userId    String   @db.Uuid
  rating    Int
  comment   String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bookId, userId])
  @@index([bookId])
  @@index([userId])
  @@map("book_reviews")
}
```

### 1.2 Tour Guides Domain
```prisma
model GuideSpecialization {
  id        Int       @id @default(autoincrement())
  nameAr    String    @map("name_ar") @db.VarChar(100)
  nameEn    String    @map("name_en") @db.VarChar(100)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  guides    GuideSpecializationMapping[]
  @@map("guide_specializations")
}

model TourGuide {
  id                  Int       @id @default(autoincrement())
  firstNameAr         String    @map("first_name_ar") @db.VarChar(100)
  firstNameEn         String    @map("first_name_en") @db.VarChar(100)
  lastNameAr          String    @map("last_name_ar") @db.VarChar(100)
  lastNameEn          String    @map("last_name_en") @db.VarChar(100)
  titleAr             String    @map("title_ar") @db.VarChar(255)
  titleEn             String    @map("title_en") @db.VarChar(255)
  bioAr               String    @map("bio_ar") @db.Text
  bioEn               String    @map("bio_en") @db.Text
  profileImage        String    @map("profile_image") @db.VarChar(500)
  yearsExperience     Int       @map("years_experience")
  hourlyRate          Decimal   @map("hourly_rate") @db.Decimal(10, 2)
  rating              Decimal?  @db.Decimal(3, 2)
  reviewCount         Int       @default(0) @map("review_count")
  email               String    @unique @db.VarChar(255)
  phone               String    @db.VarChar(20)
  responseTime        String    @map("response_time") @db.VarChar(50)
  cancellationPolicy  String    @map("cancellation_policy") @db.VarChar(255)
  groupSize           String    @map("group_size") @db.VarChar(50)
  educationAr         String    @map("education_ar") @db.Text
  educationEn         String    @map("education_en") @db.Text
  certificationsAr    String    @map("certifications_ar") @db.Text
  certificationsEn    String    @map("certifications_en") @db.Text
  highlightsAr        String[]  @map("highlights_ar")
  highlightsEn        String[]  @map("highlights_en")
  isActive            Boolean   @default(true) @map("is_active")
  isFeatured          Boolean   @default(false) @map("is_featured")
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  languages        GuideLanguage[]
  specializations  GuideSpecializationMapping[]
  areasCovered     GuideArea[]
  tours            GuideTour[]
  inquiries        GuideInquiry[]

  @@index([isActive, isFeatured])
  @@map("tour_guides")
}

model GuideLanguage {
  id          Int       @id @default(autoincrement())
  guideId     Int       @map("guide_id")
  language    String    @db.VarChar(50)
  proficiency String    @db.VarChar(50)
  guide       TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  @@unique([guideId, language])
  @@index([guideId])
  @@map("guide_languages")
}

model GuideSpecializationMapping {
  id               Int                 @id @default(autoincrement())
  guideId          Int                 @map("guide_id")
  specializationId Int                 @map("specialization_id")
  guide            TourGuide           @relation(fields: [guideId], references: [id], onDelete: Cascade)
  specialization   GuideSpecialization @relation(fields: [specializationId], references: [id])
  @@unique([guideId, specializationId])
  @@index([guideId])
  @@map("guide_specialization_mapping")
}

model GuideArea {
  id      Int       @id @default(autoincrement())
  guideId Int       @map("guide_id")
  areaAr  String    @map("area_ar") @db.VarChar(100)
  areaEn  String    @map("area_en") @db.VarChar(100)
  guide   TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  @@index([guideId])
  @@map("guide_areas")
}

model GuideTour {
  id            Int       @id @default(autoincrement())
  guideId       Int       @map("guide_id")
  titleAr       String    @map("title_ar") @db.VarChar(255)
  titleEn       String    @map("title_en") @db.VarChar(255)
  durationHours Int       @map("duration_hours")
  price         Decimal   @db.Decimal(10, 2)
  descriptionAr String?   @map("description_ar") @db.Text
  descriptionEn String?   @map("description_en") @db.Text
  guide         TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  @@index([guideId])
  @@map("guide_tours")
}

model GuideInquiry {
  id             String    @id @default(uuid()) @db.Uuid
  guideId        Int       @map("guide_id")
  userId         String?   @db.Uuid
  name           String    @db.VarChar(255)
  email          String    @db.VarChar(255)
  phone          String    @db.VarChar(20)
  tourDate       DateTime  @map("tour_date") @db.Date
  numberOfPeople Int       @map("number_of_people")
  message        String    @db.Text
  status         String    @default("pending") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz

  guide TourGuide @relation(fields: [guideId], references: [id])
  user  User?     @relation(fields: [userId], references: [id])

  @@index([guideId])
  @@index([userId])
  @@index([status])
  @@map("guide_inquiries")
}
```

### 1.3 User Features
```prisma
model FavoriteMonument {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @db.Uuid
  monumentId Int      @map("monument_id")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  monument Monument @relation(fields: [monumentId], references: [id], onDelete: Cascade)

  @@unique([userId, monumentId])
  @@index([userId])
  @@index([monumentId])
  @@map("favorite_monuments")
}

model SavedSearch {
  id             String        @id @default(uuid()) @db.Uuid
  userId         String        @db.Uuid
  nameAr         String        @map("name_ar") @db.VarChar(255)
  nameEn         String        @map("name_en") @db.VarChar(255)
  searchQuery    String        @map("search_query") @db.VarChar(500)
  eraId          Int?          @map("era_id")
  locationAr     String?       @map("location_ar") @db.VarChar(255)
  locationEn     String?       @map("location_en") @db.VarChar(255)
  monumentTypeId Int?          @map("monument_type_id")
  resultCount    Int           @default(0) @map("result_count")
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  era          Era?          @relation(fields: [eraId], references: [id])
  monumentType MonumentType? @relation(fields: [monumentTypeId], references: [id])

  @@index([userId])
  @@index([eraId])
  @@map("saved_searches")
}
```

### 1.4 Shopping Cart & Orders
```prisma
model Cart {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @unique @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]

  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid()) @db.Uuid
  cartId    String   @db.Uuid
  bookId    Int      @map("book_id")
  quantity  Int      @default(1)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  cart Cart @relation(fields: [cartId], references: [id], onDelete: Cascade)
  book Book @relation(fields: [bookId], references: [id])

  @@unique([cartId, bookId])
  @@index([cartId])
  @@index([bookId])
  @@map("cart_items")
}

model ShippingAddress {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @db.Uuid
  fullName     String   @map("full_name") @db.VarChar(255)
  phone        String   @db.VarChar(20)
  addressLine1 String   @map("address_line_1") @db.VarChar(255)
  addressLine2 String?  @map("address_line_2") @db.VarChar(255)
  city         String   @db.VarChar(100)
  state        String?  @db.VarChar(100)
  postalCode   String   @map("postal_code") @db.VarChar(20)
  country      String   @db.VarChar(100)
  isDefault    Boolean  @default(false) @map("is_default")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders Order[]

  @@index([userId])
  @@index([userId, isDefault])
  @@map("shipping_addresses")
}

model Order {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @db.Uuid
  orderNumber       String   @unique @map("order_number") @db.VarChar(50)
  shippingAddressId String   @map("shipping_address_id") @db.Uuid
  subtotal          Decimal  @db.Decimal(10, 2)
  shippingCost      Decimal  @map("shipping_cost") @db.Decimal(10, 2)
  tax               Decimal  @db.Decimal(10, 2)
  total             Decimal  @db.Decimal(10, 2)
  status            String   @default("pending") @db.VarChar(50)
  paymentStatus     String   @default("pending") @map("payment_status") @db.VarChar(50)
  paymentMethod     String?  @map("payment_method") @db.VarChar(50)
  notes             String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user            User            @relation(fields: [userId], references: [id])
  shippingAddress ShippingAddress @relation(fields: [shippingAddressId], references: [id])
  items           OrderItem[]

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@map("orders")
}

model OrderItem {
  id           String   @id @default(uuid()) @db.Uuid
  orderId      String   @db.Uuid
  bookId       Int      @map("book_id")
  quantity     Int
  priceAtOrder Decimal  @map("price_at_order") @db.Decimal(10, 2)
  subtotal     Decimal  @db.Decimal(10, 2)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  book  Book  @relation(fields: [bookId], references: [id])

  @@index([orderId])
  @@index([bookId])
  @@map("order_items")
}
```

### 1.5 Update Existing User Model
Add new relations to the `User` model:
```prisma
model User {
  // ... existing fields ...

  // Add these new relations
  cart              Cart?
  shippingAddresses ShippingAddress[]
  orders            Order[]
  favoriteMonuments FavoriteMonument[]
  savedSearches     SavedSearch[]
  bookReviews       BookReview[]
  guideInquiries    GuideInquiry[]
}
```

### 1.6 Update Existing Monument/Era/MonumentType Models
```prisma
model Monument {
  // ... existing fields ...
  favorites FavoriteMonument[]
}

model Era {
  // ... existing fields ...
  savedSearches SavedSearch[]
}

model MonumentType {
  // ... existing fields ...
  savedSearches SavedSearch[]
}
```

### Migration Commands
```bash
cd apps/api
pnpm prisma:migrate:dev --name add_ecommerce_tour_guides_and_user_features
pnpm prisma:generate
```

---

## Phase 2: API Implementation

### Implementation Order
1. Books Module (independent)
2. Cart Module (depends on Books)
3. Shipping Addresses Module (independent)
4. Orders Module (depends on Cart + Shipping Addresses)
5. Tour Guides Module (independent)
6. Favorites Module (depends on existing Monuments)
7. Saved Searches Module (depends on existing Monuments)

### 2.1 Books Module

**Location:** `apps/api/src/modules/books/`

**Files to create:**
- `books.module.ts`
- `books.controller.ts`
- `books.service.ts`
- `dto/create-book.dto.ts`
- `dto/update-book.dto.ts`
- `dto/book-filter.dto.ts`
- `dto/create-book-review.dto.ts`

**Key endpoints:**
```typescript
// Public
GET    /api/v1/books                    // List with filters (category, language, price, rating, search)
GET    /api/v1/books/:id                // Get book details
GET    /api/v1/books/categories         // List categories

// User (authenticated)
POST   /api/v1/books/:id/reviews        // Add review

// Admin
POST   /api/v1/books                    // Create book
PATCH  /api/v1/books/:id                // Update book
DELETE /api/v1/books/:id                // Delete book
```

**Controller pattern:**
```typescript
@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all books with filters' })
  async findAll(@Query() filters: BookFilterDto) {
    const result = await this.booksService.findAll(filters);
    return {
      data: result.items,
      meta: { total: result.total, page: filters.page, limit: filters.limit }
    };
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Add book review' })
  async addReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBookReviewDto,
    @CurrentUser('id') userId: string
  ) {
    const review = await this.booksService.addReview(id, userId, dto);
    return { data: review, message: 'Review added successfully' };
  }
}
```

**Service key methods:**
```typescript
@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: BookFilterDto) {
    // Implement filtering, pagination, sorting
    // Include category in response
  }

  async findOne(id: number) {
    // Include category, reviews with user info
    // Throw NotFoundError if not found
  }

  async addReview(bookId: number, userId: string, dto: CreateBookReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create review
      // Update book rating and reviewCount
    });
  }
}
```

### 2.2 Cart Module

**Location:** `apps/api/src/modules/cart/`

**Files:** Same structure as Books

**Key endpoints:**
```typescript
// All require authentication
GET    /api/v1/cart                     // Get cart with items
POST   /api/v1/cart/items               // Add item to cart
PATCH  /api/v1/cart/items/:id           // Update quantity
DELETE /api/v1/cart/items/:id           // Remove item
DELETE /api/v1/cart                     // Clear cart
```

**Service key method:**
```typescript
async addToCart(userId: string, dto: AddToCartDto) {
  return this.prisma.$transaction(async (tx) => {
    // Get or create cart
    // Check if book already in cart
    // Update quantity or create new cart item
  });
}
```

### 2.3 Shipping Addresses Module

**Location:** `apps/api/src/modules/shipping-addresses/`

**Key endpoints:**
```typescript
// All require authentication
GET    /api/v1/shipping-addresses       // List user's addresses
POST   /api/v1/shipping-addresses       // Create address
PATCH  /api/v1/shipping-addresses/:id   // Update address
DELETE /api/v1/shipping-addresses/:id   // Delete address
POST   /api/v1/shipping-addresses/:id/set-default // Set as default
```

**Key logic:**
- When setting default, unset other addresses
- Validate address belongs to user

### 2.4 Orders Module

**Location:** `apps/api/src/modules/orders/`

**Key endpoints:**
```typescript
// User
POST   /api/v1/orders                   // Create from cart
GET    /api/v1/orders                   // Get user's orders
GET    /api/v1/orders/:id               // Get order details

// Admin
GET    /api/v1/orders/all               // List all orders
PATCH  /api/v1/orders/:id/status        // Update status
```

**Service key method:**
```typescript
async createOrder(userId: string, dto: CreateOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Get cart with items
    // 2. Validate shipping address
    // 3. Calculate totals
    // 4. Generate order number
    // 5. Create order with items
    // 6. Clear cart
  });
}
```

### 2.5 Tour Guides Module

**Location:** `apps/api/src/modules/tour-guides/`

**Key endpoints:**
```typescript
// Public
GET    /api/v1/tour-guides              // List with filters (specialization, language, area)
GET    /api/v1/tour-guides/:id          // Get profile details
GET    /api/v1/tour-guides/specializations // List all

// User
POST   /api/v1/tour-guides/:id/inquire  // Submit inquiry

// Admin
POST   /api/v1/tour-guides              // Create guide
PATCH  /api/v1/tour-guides/:id          // Update guide
DELETE /api/v1/tour-guides/:id          // Delete guide
```

**Service create method:**
```typescript
async create(dto: CreateTourGuideDto) {
  return this.prisma.$transaction(async (tx) => {
    const guide = await tx.tourGuide.create({
      data: {
        // Main fields
        firstNameAr: dto.firstNameAr,
        // ...

        // Nested languages
        languages: {
          create: dto.languages.map(lang => ({
            language: lang.language,
            proficiency: lang.proficiency
          }))
        },

        // Nested areas
        areasCovered: { create: dto.areas },

        // Nested tours
        tours: { create: dto.tours },

        // Nested specializations (many-to-many)
        specializations: {
          create: dto.specializationIds.map(id => ({
            specializationId: id
          }))
        }
      },
      include: {
        languages: true,
        areasCovered: true,
        tours: true,
        specializations: { include: { specialization: true } }
      }
    });
    return guide;
  });
}
```

### 2.6 Favorites Module

**Location:** `apps/api/src/modules/favorites/`

**Key endpoints:**
```typescript
// All require authentication
GET    /api/v1/favorites                // Get favorites with filters
POST   /api/v1/favorites                // Add monument
DELETE /api/v1/favorites/:monumentId    // Remove monument
GET    /api/v1/favorites/stats          // Get stats
```

**Service methods:**
```typescript
async addFavorite(userId: string, monumentId: number) {
  // Check monument exists
  // Create favorite (unique constraint handles duplicates)
}

async findUserFavorites(userId: string, filters) {
  return this.prisma.favoriteMonument.findMany({
    where: {
      userId,
      monument: {
        // Apply search, era filters
      }
    },
    include: {
      monument: {
        include: { era: true, monumentType: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
```

### 2.7 Saved Searches Module

**Location:** `apps/api/src/modules/saved-searches/`

**Key endpoints:**
```typescript
// All require authentication
GET    /api/v1/saved-searches           // Get user's saved searches
POST   /api/v1/saved-searches           // Create saved search
PATCH  /api/v1/saved-searches/:id       // Update saved search
DELETE /api/v1/saved-searches/:id       // Delete saved search
POST   /api/v1/saved-searches/:id/run   // Execute search
```

**Service key method:**
```typescript
async executeSearch(userId: string, searchId: string) {
  const search = await this.prisma.savedSearch.findFirst({
    where: { id: searchId, userId }
  });

  if (!search) throw new NotFoundError('SavedSearch', searchId);

  // Execute monument search with filters
  const monuments = await this.prisma.monument.findMany({
    where: {
      OR: [
        { monumentNameEn: { contains: search.searchQuery, mode: 'insensitive' } },
        { monumentNameAr: { contains: search.searchQuery, mode: 'insensitive' } }
      ],
      ...(search.eraId && { eraId: search.eraId }),
      ...(search.monumentTypeId && { monumentsTypeId: search.monumentTypeId })
    },
    include: { era: true, monumentType: true }
  });

  // Update result count
  await this.prisma.savedSearch.update({
    where: { id: searchId },
    data: { resultCount: monuments.length }
  });

  return monuments;
}
```

---

## Phase 3: Module Registration

### File: `apps/api/src/app.module.ts`

Add imports and register modules:
```typescript
import { BooksModule } from './modules/books/books.module';
import { CartModule } from './modules/cart/cart.module';
import { ShippingAddressesModule } from './modules/shipping-addresses/shipping-addresses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TourGuidesModule } from './modules/tour-guides/tour-guides.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';

@Module({
  imports: [
    // ... existing imports ...

    // E-commerce modules
    BooksModule,
    CartModule,
    ShippingAddressesModule,
    OrdersModule,

    // User feature modules
    TourGuidesModule,
    FavoritesModule,
    SavedSearchesModule,
  ],
})
export class AppModule {}
```

---

## Phase 4: Testing & Validation

### Test Coverage
1. **Books**: CRUD, filtering, pagination, reviews
2. **Cart**: Add/remove items, quantity updates, cart creation
3. **Orders**: Create from cart, calculate totals, clear cart after order
4. **Tour Guides**: Nested data creation, filtering, inquiry submission
5. **Favorites**: Add/remove, filtering, stats
6. **Saved Searches**: Create, execute, update result counts

### Manual Testing Checklist
- [ ] Books catalog browsing (public, no auth)
- [ ] Add multiple books to cart
- [ ] Create shipping address
- [ ] Create order from cart
- [ ] Browse tour guides with filters
- [ ] Submit guide inquiry
- [ ] Add monuments to favorites
- [ ] Save search query and execute it

---

## Key Patterns to Follow

### 1. Controller Pattern
```typescript
@ApiTags('Resource')
@Controller('resource')
export class ResourceController {
  @Get()
  @Public() // For public endpoints
  async findAll(@Query() filters: FilterDto) { }

  @Post()
  async create(@Body() dto: CreateDto, @CurrentUser('id') userId: string) { }
}
```

### 2. Service Pattern
```typescript
@Injectable()
export class ResourceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDto) {
    // Use transactions for complex operations
    return this.prisma.$transaction(async (tx) => {
      // ...
    });
  }
}
```

### 3. Error Handling
```typescript
if (!resource) {
  throw new NotFoundError('Resource', id.toString());
}
```

### 4. Filtering & Pagination
```typescript
const where: Prisma.ResourceWhereInput = {
  ...(filters.field && { field: filters.field }),
  ...(filters.search && {
    OR: [
      { fieldEn: { contains: filters.search, mode: 'insensitive' } },
      { fieldAr: { contains: filters.search, mode: 'insensitive' } }
    ]
  })
};

const [items, total] = await Promise.all([
  this.prisma.resource.findMany({
    where,
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit
  }),
  this.prisma.resource.count({ where })
]);
```

---

## Critical Files to Implement

1. **Database Schema**: `apps/api/prisma/schema.prisma`
2. **Books Service**: `apps/api/src/modules/books/books.service.ts`
3. **Cart Service**: `apps/api/src/modules/cart/cart.service.ts`
4. **Orders Service**: `apps/api/src/modules/orders/orders.service.ts`
5. **Tour Guides Service**: `apps/api/src/modules/tour-guides/tour-guides.service.ts`
6. **App Module**: `apps/api/src/app.module.ts`

---

## Additional Considerations

### Authentication
- Public: Books catalog, Tour guides listing
- User: Cart, Orders, Favorites, Saved Searches, Reviews, Inquiries
- Admin: CRUD for Books and Tour Guides

### Data Validation
- Use `class-validator` decorators in all DTOs
- Use `ParseIntPipe` for integer IDs
- Use `@ApiProperty()` for Swagger documentation

### Response Format
```typescript
// Success
{ data: T, message?: string, meta?: object }

// Error (handled by AllExceptionsFilter)
{ error: { code: string, message: string, correlationId: string } }
```
