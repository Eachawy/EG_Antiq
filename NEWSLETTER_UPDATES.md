# Newsletter System Updates - January 25, 2026

## 🎉 What's Changed

The newsletter system has been completely redesigned for simplicity and consistency. No more manual HTML editing - just click "Send Newsletter" and it automatically sends a beautiful email with the latest 4 monuments from your database!

## ✅ Fixes Implemented

### 1. **Dynamic Monument Cards** ✅
- Monument cards are now **truly dynamic** - fetched from the database every time you send
- Shows the **latest 4 monuments** based on creation date
- No more static cards!

### 2. **Proper 2-Column Grid Layout** ✅
- Fixed email client compatibility issues
- Monument cards now display in a **2x2 grid** (2 columns, 2 rows)
- Uses table-based layout for maximum email client compatibility
- Tested for Gmail, Outlook, Apple Mail, etc.

### 3. **Simplified Admin Workflow** ✅
- **No more "Compose Newsletter" popup!**
- Just click **"Send Newsletter"** button
- Uses a fixed, professional template automatically
- Subject line is auto-generated: "Kemetra Newsletter - [Current Month Year]"

## 📧 New Newsletter System

### How It Works

1. **Admin clicks "Send Newsletter"** in Kemetra admin panel
2. System loads the fixed newsletter template
3. Fetches the **latest 4 monuments** from database (ordered by `createdAt DESC`)
4. Generates beautiful 2-column grid cards
5. Converts all image paths to absolute URLs
6. Sends to all active subscribers

**That's it! One click!**

### What Gets Sent

**Subject:** `Kemetra Newsletter - January 2026` (auto-generated with current date)

**Content:**
- **Header:** Kemetra logo + "January 2026 Monthly Newsletter"
- **Title:** "Recently Added Monuments"
- **Subtitle:** "Explore our latest archaeological discoveries"
- **Monument Cards:** 2x2 grid with latest 4 monuments
  - Each card shows:
    - Monument image (200px height)
    - Monument name (max 40 characters)
    - Description (max 130 characters)
    - Creation date with calendar icon (📅)
    - "Explore →" link in gold color
- **Footer:** Kemetra logo + tagline + navigation links

## 🔌 API Endpoints

### New Simple Endpoint (Recommended)

**`POST /api/v1/admin/newsletter/send`**

**Description:** Send newsletter with fixed template and latest 4 monuments

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body:** _(None required!)_

**Response:**
```json
{
  "data": {
    "campaignId": "uuid",
    "recipientCount": 150,
    "successCount": 148,
    "failureCount": 2
  },
  "message": "Newsletter sent successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/newsletter/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Advanced Custom Endpoint (Optional)

If you need full customization, there's still an advanced endpoint:

**`POST /api/v1/admin/newsletter/send-custom`**

**Request Body:**
```json
{
  "subject": "Custom Subject",
  "content": "Plain text content",
  "htmlContent": "<html>...<!-- MONUMENT-CARDS -->...</html>"
}
```

## 📋 Newsletter Template

The fixed template is located at:
```
/apps/api/templates/newsletter-template.html
```

### Template Structure

```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <table width="100%">
    <!-- Header: Logo + Date -->
    <tr>
      <td>
        <img src="content/images/kemetraLogo.png" />
        <p>January 2026<br>Monthly Newsletter</p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td>
        <h1>Recently Added Monuments</h1>
        <p>Explore our latest archaeological discoveries</p>

        <!-- Monument Cards Placeholder -->
        <!-- MONUMENT-CARDS -->
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td>
        <img src="content/images/kemetraLogo.png" />
        <p>Preserving Egypt's Archaeological Heritage</p>
        <!-- Links, unsubscribe, copyright -->
      </td>
    </tr>
  </table>
</body>
</html>
```

## 🎨 Monument Card Design

Each monument card uses email-safe HTML with inline styles:

```html
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
  <tr>
    <td>
      <img src="[monument-image]" width="100%" height="200" />
    </td>
  </tr>
  <tr>
    <td style="padding: 20px;">
      <h3>[Monument Name - max 40 chars]</h3>
      <p>[Description - max 130 chars]</p>
      <table width="100%">
        <tr>
          <td>📅 [Date]</td>
          <td align="right">
            <a href="[link]" style="color: #c9a961;">Explore →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

## 🖼️ Adding the Logo

1. **Copy your logo:**
   ```bash
   cp /path/to/kemetraLogo.png \
      /Volumes/Data/Ancient/Antiq/EG_Antiq/apps/api/uploads/content/images/kemetraLogo.png
   ```

2. **Verify it's accessible:**
   ```
   http://localhost:3000/uploads/content/images/kemetraLogo.png
   ```

3. **That's it!** The template already references it, and the system automatically converts the relative path to an absolute URL.

## 🔧 Customizing the Template

If you need to customize the newsletter design:

1. **Edit the template file:**
   ```
   /apps/api/templates/newsletter-template.html
   ```

2. **Keep the placeholder:**
   Make sure to keep `<!-- MONUMENT-CARDS -->` in your template

3. **Rebuild Docker:**
   ```bash
   docker compose build api
   docker compose up -d api
   ```

## 📊 Testing the Newsletter

### Test with Swagger UI

1. Open: http://localhost:3000/api/docs
2. Navigate to: **Admin - Newsletter Management**
3. Find endpoint: **POST /api/v1/admin/newsletter/send**
4. Click "Try it out"
5. Click "Execute"

### Test via cURL

```bash
# First, login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'

# Copy the access token, then send newsletter
curl -X POST http://localhost:3000/api/v1/admin/newsletter/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎯 Color Scheme

The newsletter uses these colors:

- **Gold Accent:** `#c9a961` (links, CTA buttons)
- **Dark Text:** `#2c3e50` (headings)
- **Body Text:** `#666666` (descriptions)
- **Light Text:** `#999999` (dates, metadata)
- **Background:** `#f5f5f5` (page background)
- **Card Background:** `#ffffff` (monument cards)
- **Borders:** `#e5e5e5` (dividers, card borders)

## 📁 File Locations

```
/apps/api/
├── templates/
│   └── newsletter-template.html          # Fixed newsletter template
├── uploads/
│   └── content/
│       └── images/
│           └── kemetraLogo.png           # Your logo here
└── src/
    └── modules/
        └── newsletter/
            ├── newsletter.service.ts      # Newsletter logic
            └── admin-newsletter.controller.ts  # API endpoints
```

## ⚙️ Docker Commands

```bash
# Rebuild and restart API
docker compose build api
docker compose up -d api

# Check logs
docker compose logs -f api

# Check status
docker compose ps

# Stop all services
docker compose down
```

## 🔍 Troubleshooting

### Cards Not Showing as Dynamic

**Problem:** Newsletter shows static cards or no cards at all

**Solution:**
1. Check if monuments exist in database
2. Verify template has `<!-- MONUMENT-CARDS -->` placeholder
3. Check API logs: `docker compose logs -f api`

### Images Not Displaying

**Problem:** Logo or monument images not showing in email

**Solution:**
1. Verify logo exists: `http://localhost:3000/uploads/content/images/kemetraLogo.png`
2. Check API_URL in `.env` file
3. Ensure monument images are in `/uploads/` directory

### Layout Issues in Email Client

**Problem:** Newsletter doesn't look right in Gmail/Outlook

**Solution:**
- The template uses table-based layout for maximum compatibility
- If you modified the template, ensure you're using `<table>` not `<div>` elements
- All styles must be inline (no external CSS)
- Test in multiple email clients

### "Send Newsletter" Returns Error

**Problem:** API returns 400 or 500 error

**Possible Causes:**
1. **No subscribers:** Check if you have active newsletter subscribers
2. **Template not found:** Ensure `/apps/api/templates/newsletter-template.html` exists
3. **Database connection:** Check PostgreSQL is running

**Check logs:**
```bash
docker compose logs api | grep -i error
```

## 📖 Migration Guide

### Before (Old System)

1. Admin clicks "Compose Newsletter"
2. Popup appears with fields: subject, content, htmlContent
3. Admin manually creates HTML with static monument cards
4. Admin pastes HTML into htmlContent field
5. Clicks Send

**Problems:**
- Manual HTML editing required
- Cards were static (not from database)
- No consistency between newsletters
- Time-consuming

### After (New System)

1. Admin clicks "Send Newsletter"
2. ✅ Done!

**Benefits:**
- ✅ No manual work
- ✅ Always shows latest monuments from database
- ✅ Consistent professional design
- ✅ One-click operation

## 🚀 Next Steps

1. **Add your logo** to `/apps/api/uploads/content/images/kemetraLogo.png`
2. **Test the endpoint** using Swagger UI at http://localhost:3000/api/docs
3. **Send a test newsletter** to verify everything works
4. **Check your email** to see the beautiful 2-column grid layout

## 📞 Support

If you encounter any issues:

1. **Check API logs:** `docker compose logs -f api`
2. **Verify database:** Ensure PostgreSQL is running and has monuments
3. **Test health endpoint:** `curl http://localhost:3000/api/v1/health`
4. **Review this guide** for troubleshooting tips

---

**Last Updated:** January 25, 2026
**Version:** 2.0.0
**Status:** ✅ Production Ready
