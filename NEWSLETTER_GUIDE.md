# Newsletter Implementation Guide

## Overview

The newsletter system has been enhanced to automatically fetch the latest 4 monuments from the database and display them in a beautiful 2-column grid layout matching your design.

## Features Implemented

### 1. Dynamic Monument Cards
- ✅ Fetches the latest 4 monuments from the database (ordered by creation date)
- ✅ Displays in a responsive 2-column grid layout
- ✅ Truncates monument names to 40 characters maximum
- ✅ Truncates descriptions to 130 characters maximum
- ✅ Includes monument image, name, description, date, and "Explore" link
- ✅ Professional styling matching the newsletter design

### 2. Automatic Image URL Conversion
- ✅ Converts all relative image paths to absolute URLs
- ✅ Handles logo images (e.g., `content/images/kemetraLogo.png`)
- ✅ Works with monument images from the database
- ✅ Supports both `/uploads/` and direct relative paths

### 3. Docker Deployment
- ✅ API deployed on Docker (http://localhost:3000)
- ✅ PostgreSQL database running on port 5433
- ✅ Redis cache running on port 6379
- ✅ All services healthy and operational

## How to Use

### Creating a Newsletter Template

In your admin panel (Kemetra), create an HTML email template with the following structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kemetra Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <!-- Container -->
  <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff;">

    <!-- Header -->
    <div style="padding: 40px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e0e0e0;">
      <img src="content/images/kemetraLogo.png" alt="Kemetra" style="max-width: 200px; height: auto;" />
      <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
        January 2026<br>Monthly Newsletter
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px;">
      <h1 style="color: #2c3e50; font-size: 28px; margin: 0 0 10px 0;">Recently Added Monuments</h1>
      <p style="color: #7f8c8d; font-size: 16px; margin: 0 0 30px 0;">Explore our latest archaeological discoveries</p>

      <!-- Monument Cards - Will be replaced automatically -->
      <!-- MONUMENT-CARDS -->

    </div>

    <!-- Footer -->
    <div style="padding: 40px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e0e0e0;">
      <img src="content/images/kemetraLogo.png" alt="Kemetra" style="max-width: 150px; height: auto; margin-bottom: 20px;" />
      <p style="color: #2c3e50; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">
        Preserving Egypt's Archaeological Heritage
      </p>
      <p style="color: #7f8c8d; font-size: 14px; margin: 0 0 20px 0;">
        Connecting people with Egypt's most significant monuments and cultural landmarks
      </p>

      <!-- Navigation Links -->
      <div style="margin: 20px 0;">
        <a href="#" style="color: #c9a961; text-decoration: none; margin: 0 10px;">Visit Website</a>
        <span style="color: #ddd;">·</span>
        <a href="#" style="color: #c9a961; text-decoration: none; margin: 0 10px;">Browse Monuments</a>
        <span style="color: #ddd;">·</span>
        <a href="#" style="color: #c9a961; text-decoration: none; margin: 0 10px;">Interactive Map</a>
        <span style="color: #ddd;">·</span>
        <a href="#" style="color: #c9a961; text-decoration: none; margin: 0 10px;">About Kemetra</a>
        <span style="color: #ddd;">·</span>
        <a href="#" style="color: #c9a961; text-decoration: none; margin: 0 10px;">Contact Us</a>
      </div>

      <!-- Legal -->
      <p style="color: #95a5a6; font-size: 12px; margin: 20px 0;">
        You're receiving this newsletter because you're a valued member of the Kemetra community.
      </p>
      <p style="color: #95a5a6; font-size: 12px; margin: 10px 0;">
        <a href="#" style="color: #95a5a6; text-decoration: none;">Unsubscribe</a>
        <span style="margin: 0 5px;">·</span>
        <a href="#" style="color: #95a5a6; text-decoration: none;">Privacy Policy</a>
      </p>
      <p style="color: #bdc3c7; font-size: 11px; margin: 10px 0;">
        © 2026 Kemetra. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
```

### Placeholder Options

You can use any of these placeholders in your template:

1. **HTML Comment (Recommended):**
   ```html
   <!-- MONUMENT-CARDS -->
   ```

2. **Template Variables:**
   ```html
   {{monument-cards}}
   <!-- or -->
   {{latest_monuments}}
   ```

3. **Section Markers:**
   ```html
   <!-- START-MONUMENTS -->
     <!-- Static cards here will be replaced -->
   <!-- END-MONUMENTS -->
   ```

### Adding the Kemetra Logo

1. Copy your logo to:
   ```
   /Volumes/Data/Ancient/Antiq/EG_Antiq/apps/api/uploads/content/images/kemetraLogo.png
   ```

2. In your template, reference it as:
   ```html
   <img src="content/images/kemetraLogo.png" alt="Kemetra" />
   ```

3. The system will automatically convert it to:
   ```html
   <img src="http://your-api-url/uploads/content/images/kemetraLogo.png" alt="Kemetra" />
   ```

## Generated Monument Card Structure

Each monument card includes:

```html
<div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  <img src="[monument-image]" alt="[monument-name]" style="width: 100%; height: 250px; object-fit: cover;" />
  <div style="padding: 24px;">
    <h3 style="color: #2c3e50; font-size: 20px; font-weight: 600;">
      [Monument Name - Max 40 chars]
    </h3>
    <p style="color: #5a6c7d; font-size: 15px; line-height: 1.6;">
      [Monument Description - Max 130 chars]
    </p>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #95a5a6; font-size: 14px;">📅 [Date]</span>
      <a href="[monument-link]" style="color: #c9a961; text-decoration: none;">Explore →</a>
    </div>
  </div>
</div>
```

## Sending a Newsletter

### Via Admin API Endpoint

**Endpoint:** `POST /api/v1/admin/newsletter/send`

**Headers:**
```
Authorization: Bearer [your-admin-jwt-token]
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Kemetra Newsletter - January 2026",
  "content": "Plain text fallback for email clients that don't support HTML",
  "htmlContent": "[Your HTML template with <!-- MONUMENT-CARDS --> placeholder]"
}
```

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

## Docker Management

### Start Services
```bash
docker compose up -d postgres redis api
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f api
```

### Rebuild API
```bash
docker compose build api
docker compose up -d api
```

### Check Status
```bash
docker compose ps
```

## Service URLs

- **API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/v1/health
- **API Docs**: http://localhost:3000/api/docs
- **Uploaded Files**: http://localhost:3000/uploads/
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

## Testing

### 1. Test API Health
```bash
curl http://localhost:3000/api/v1/health
```

### 2. Test Image Access
```bash
curl http://localhost:3000/uploads/content/images/kemetraLogo.png
```

### 3. Test Newsletter Endpoint (requires authentication)
```bash
curl -X POST http://localhost:3000/api/v1/admin/newsletter/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Newsletter",
    "content": "Test content",
    "htmlContent": "<html><body><!-- MONUMENT-CARDS --></body></html>"
  }'
```

## Troubleshooting

### Images Not Displaying
1. Ensure the logo is in `/apps/api/uploads/content/images/kemetraLogo.png`
2. Verify the API_URL in your `.env` file
3. Check that images are accessible at `http://localhost:3000/uploads/content/images/kemetraLogo.png`

### Monument Cards Not Appearing
1. Verify you have monuments in the database
2. Check that the placeholder is correct (e.g., `<!-- MONUMENT-CARDS -->`)
3. Review API logs: `docker compose logs -f api`

### Email Not Sending
1. Check email configuration in `.env` file
2. Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD are set
3. Check the newsletter campaign status in the database

## Database Schema

The newsletter feature uses these tables:

- `monuments` - Monument data (id, name, image, biography, createdAt)
- `newsletter_subscriptions` - Subscriber list
- `newsletter_campaigns` - Campaign history
- `newsletter_deliveries` - Email delivery tracking

## Color Scheme

The newsletter design uses:

- **Primary Gold**: `#c9a961` (links, accents)
- **Dark Text**: `#2c3e50` (headings)
- **Medium Text**: `#5a6c7d` (body text)
- **Light Text**: `#95a5a6` (metadata, dates)
- **Background**: `#f5f5f5` (page background)
- **Card Background**: `#ffffff` (cards, content areas)
- **Border**: `#e0e0e0` (dividers, borders)

## Support

For issues or questions:
1. Check API logs: `docker compose logs -f api`
2. Verify database connection: Check PostgreSQL logs
3. Test endpoints with Swagger docs: http://localhost:3000/api/docs

---

**Implementation Date:** January 25, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
