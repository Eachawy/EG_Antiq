# Quick Start - Simplified Newsletter System

## ✅ What's Fixed

1. **✅ Dynamic Monument Cards** - Now fetches from database, not static
2. **✅ 2-Column Grid Layout** - Proper email-compatible table layout
3. **✅ Simplified Admin** - Just "Send Newsletter" button, no compose popup

## 🚀 How to Use (Super Simple!)

### For Admin Users in Kemetra

**Old Way (Before):**
1. Click "Compose Newsletter"
2. Fill out form with subject, content, htmlContent
3. Manually write HTML
4. Click Send

**New Way (Now):**
1. Click **"Send Newsletter"**
2. ✅ Done!

That's it! The system automatically:
- Uses a fixed professional template
- Fetches the latest 4 monuments from database
- Generates 2-column grid cards
- Sends to all subscribers

## 📧 API Endpoint

### Simple Endpoint (No Parameters Needed!)

```bash
POST /api/v1/admin/newsletter/send
Authorization: Bearer YOUR_JWT_TOKEN
```

**No request body needed!** Just send the POST request.

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/newsletter/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🖼️ Adding Your Logo

1. Copy logo file:
```bash
cp /path/to/kemetraLogo.png \
   /Volumes/Data/Ancient/Antiq/EG_Antiq/apps/api/uploads/content/images/kemetraLogo.png
```

2. Verify:
```
http://localhost:3000/uploads/content/images/kemetraLogo.png
```

## 📊 What the Newsletter Looks Like

**Email Subject:** `Kemetra Newsletter - January 2026`

**Layout:**
```
┌────────────────────────────────────────────┐
│  KEMETRA LOGO        January 2026          │
│                      Monthly Newsletter    │
├────────────────────────────────────────────┤
│  Recently Added Monuments                  │
│  Explore our latest archaeological...     │
│                                            │
│  ┌────────────┐      ┌────────────┐       │
│  │ Monument 1 │      │ Monument 2 │       │
│  │ [Image]    │      │ [Image]    │       │
│  │ Name       │      │ Name       │       │
│  │ Desc...    │      │ Desc...    │       │
│  │ 📅 Date    │      │ 📅 Date    │       │
│  │ Explore → │      │ Explore → │       │
│  └────────────┘      └────────────┘       │
│                                            │
│  ┌────────────┐      ┌────────────┐       │
│  │ Monument 3 │      │ Monument 4 │       │
│  │ [Image]    │      │ [Image]    │       │
│  │ Name       │      │ Name       │       │
│  │ Desc...    │      │ Desc...    │       │
│  │ 📅 Date    │      │ 📅 Date    │       │
│  │ Explore → │      │ Explore → │       │
│  └────────────┘      └────────────┘       │
├────────────────────────────────────────────┤
│  KEMETRA LOGO                              │
│  Preserving Egypt's Archaeological Heritage│
│  Visit Website · Browse Monuments · Map   │
│  Unsubscribe · Privacy Policy              │
│  © 2026 Kemetra                            │
└────────────────────────────────────────────┘
```

## 🧪 Testing

### Quick Test
1. Open: http://localhost:3000/api/docs
2. Find: **POST /api/v1/admin/newsletter/send**
3. Click "Try it out"
4. Click "Execute"
5. Check email!

### Via cURL
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.data.accessToken')

# 2. Send Newsletter
curl -X POST http://localhost:3000/api/v1/admin/newsletter/send \
  -H "Authorization: Bearer $TOKEN"
```

## 📁 Important Files

- **Template:** `/apps/api/templates/newsletter-template.html`
- **Logo:** `/apps/api/uploads/content/images/kemetraLogo.png`
- **Service:** `/apps/api/src/modules/newsletter/newsletter.service.ts`
- **Controller:** `/apps/api/src/modules/newsletter/admin-newsletter.controller.ts`

## 🔧 Docker Commands

```bash
# Rebuild if you make changes
docker compose build api
docker compose up -d api

# Check logs
docker compose logs -f api

# Status
docker compose ps
```

## ⚡ Summary

**Before:** Manual HTML editing, static cards, complex workflow
**After:** One-click, dynamic database-driven cards, automatic!

**Status:** ✅ **Ready to use!**

## 📖 Full Documentation

- **Complete Guide:** `NEWSLETTER_UPDATES.md`
- **Original Guide:** `NEWSLETTER_GUIDE.md`
