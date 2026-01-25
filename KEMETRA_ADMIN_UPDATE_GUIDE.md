# Kemetra Admin Panel Update Guide

## Overview

Your backend API has been updated with a simplified newsletter system. You now need to update your Kemetra admin panel to match the new API endpoint.

## What Changed in the API

### Old Endpoint (Before)
```
POST /api/v1/admin/newsletter/send

Request Body:
{
  "subject": "Newsletter subject",
  "content": "Plain text content",
  "htmlContent": "<html>...</html>"
}
```

### New Endpoint (Now)
```
POST /api/v1/admin/newsletter/send

Request Body: (NONE - leave empty!)
```

## Steps to Update Kemetra Admin Panel

### Step 1: Find the Newsletter Component

1. Log in to your Kemetra admin panel
2. Navigate to the "Newsletter" or "Send Newsletter" page/component
3. Enter edit mode for this component

### Step 2: Remove the Compose Form

**Find and remove these fields:**
- ❌ `subject` input field
- ❌ `content` textarea
- ❌ `htmlContent` textarea/editor
- ❌ Any "Compose Newsletter" modal/popup

### Step 3: Update to Simple Button

**Replace with:**
- ✅ Single button: "Send Newsletter"
- ✅ No form fields needed

### Step 4: Update the API Call

**Old API Configuration:**
```javascript
// OLD - Remove this
{
  method: "POST",
  url: "{{api_url}}/api/v1/admin/newsletter/send",
  headers: {
    "Authorization": "Bearer {{jwt_token}}"
  },
  body: {
    "subject": {{subject_input.value}},
    "content": {{content_input.value}},
    "htmlContent": {{html_editor.value}}
  }
}
```

**New API Configuration:**
```javascript
// NEW - Use this instead
{
  method: "POST",
  url: "{{api_url}}/api/v1/admin/newsletter/send",
  headers: {
    "Authorization": "Bearer {{jwt_token}}",
    "Content-Type": "application/json"
  }
  // NO BODY NEEDED!
}
```

### Step 5: Update Success Message

After the button is clicked and API call succeeds, show:

```
✅ Newsletter sent successfully!

Sent to: {{response.data.recipientCount}} subscribers
Success: {{response.data.successCount}}
Failed: {{response.data.failureCount}}
```

## Detailed Configuration Examples

### For Retool

1. **Delete Form Components:**
   - Delete the "Subject" text input
   - Delete the "Content" text area
   - Delete the "HTML Content" rich text editor
   - Delete the "Compose" button

2. **Add Simple Button:**
   - Add a new button component
   - Set button text: "Send Newsletter"
   - Set button color: Primary (blue/green)

3. **Configure Button Action:**
   ```javascript
   // Query name: sendNewsletterQuery
   // Type: REST API

   // Resource: Your API base URL
   // Method: POST
   // URL: /api/v1/admin/newsletter/send

   // Headers:
   Authorization: Bearer {{current_user.jwt_token}}
   Content-Type: application/json

   // Body: Leave empty or set to {}
   ```

4. **Add Success Notification:**
   ```javascript
   // On Success Trigger:
   utils.showNotification({
     message: `Newsletter sent to ${sendNewsletterQuery.data.data.recipientCount} subscribers!`,
     type: 'success'
   });
   ```

### For Appsmith

1. **Remove Form Widgets:**
   - Delete Subject input widget
   - Delete Content input widget
   - Delete HTML editor widget

2. **Add Button Widget:**
   - Drag a Button widget to the page
   - Set label: "Send Newsletter"

3. **Create API Query:**
   ```javascript
   // API Name: SendNewsletter
   // Method: POST
   // URL: {{appsmith.store.apiUrl}}/api/v1/admin/newsletter/send

   // Headers:
   {
     "Authorization": "Bearer {{appsmith.store.jwtToken}}",
     "Content-Type": "application/json"
   }

   // Body: {}
   ```

4. **Configure Button onClick:**
   ```javascript
   {{
     SendNewsletter.run()
       .then(() => {
         showAlert(`Newsletter sent to ${SendNewsletter.data.data.recipientCount} subscribers!`, 'success');
       })
       .catch((error) => {
         showAlert(`Failed to send newsletter: ${error.message}`, 'error');
       });
   }}
   ```

### For Budibase

1. **Edit Newsletter Form:**
   - Delete all form fields (subject, content, htmlContent)
   - Keep only the submit button

2. **Rename Button:**
   - Change button text to "Send Newsletter"

3. **Update Data Source:**
   ```javascript
   // Data Source: REST API
   // URL: {{env.API_URL}}/api/v1/admin/newsletter/send
   // Method: POST

   // Headers:
   Authorization: Bearer {{globals.user.token}}
   Content-Type: application/json

   // Body: Empty or {}
   ```

### For Custom Admin Panel (React/Vue/Angular)

If using a custom-built admin panel:

**React Example:**
```jsx
import { useState } from 'react';
import axios from 'axios';

function NewsletterPage() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendNewsletter = async () => {
    setSending(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/admin/newsletter/send`,
        {}, // Empty body
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setResult(response.data.data);
      alert(`Newsletter sent to ${response.data.data.recipientCount} subscribers!`);
    } catch (error) {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1>Send Newsletter</h1>
      <p>Send the monthly newsletter with the latest 4 monuments to all subscribers.</p>

      <button
        onClick={handleSendNewsletter}
        disabled={sending}
        style={{
          padding: '12px 24px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: sending ? 'not-allowed' : 'pointer'
        }}
      >
        {sending ? 'Sending...' : 'Send Newsletter'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
          <h3>✅ Newsletter Sent Successfully!</h3>
          <p>Recipients: {result.recipientCount}</p>
          <p>Successful: {result.successCount}</p>
          <p>Failed: {result.failureCount}</p>
        </div>
      )}
    </div>
  );
}

export default NewsletterPage;
```

## Testing the Update

### Step 1: Test the API Endpoint Directly

```bash
# Get your JWT token from the admin panel (check browser DevTools → Application → Local Storage)
TOKEN="your-jwt-token-here"

# Test the endpoint
curl -X POST http://localhost:3000/api/v1/admin/newsletter/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "data": {
    "campaignId": "uuid-here",
    "recipientCount": 150,
    "successCount": 148,
    "failureCount": 2
  },
  "message": "Newsletter sent successfully"
}
```

### Step 2: Test in Kemetra Admin Panel

1. Click the "Send Newsletter" button
2. Check for success message
3. Verify in your email that the newsletter arrived with:
   - ✅ Professional header with logo
   - ✅ 2-column grid with 4 monuments
   - ✅ Monument images, names, descriptions
   - ✅ Dates and "Explore →" links
   - ✅ Footer with logo and navigation

## What the Newsletter Contains

The system automatically generates:

**Subject:** `Kemetra Newsletter - January 2026`

**Content:**
- Header: Kemetra logo + date
- Title: "Recently Added Monuments"
- 4 Monument Cards (2x2 grid):
  - Card 1 (Top Left): Latest monument
  - Card 2 (Top Right): 2nd latest monument
  - Card 3 (Bottom Left): 3rd latest monument
  - Card 4 (Bottom Right): 4th latest monument
- Footer: Logo, tagline, links, unsubscribe

Each monument card shows:
- Monument image (200px height)
- Monument name (max 40 characters)
- Description (max 130 characters)
- Creation date
- "Explore →" link

## Troubleshooting

### Error: "No active subscribers found"

**Problem:** No subscribers in database

**Solution:**
1. Check database: `SELECT COUNT(*) FROM newsletter_subscriptions WHERE is_subscribed = true;`
2. Add test subscriber via API or database

### Error: "Authorization failed" or 401

**Problem:** JWT token invalid or expired

**Solution:**
1. Log out and log back in to get fresh token
2. Check token in request headers
3. Verify token in Kemetra admin panel settings

### Error: "Template not found"

**Problem:** Newsletter template missing in Docker container

**Solution:**
```bash
# Rebuild Docker with template
docker compose build api
docker compose up -d api

# Verify template exists
docker exec backend-api ls -la /app/apps/api/templates/
```

### Newsletter sent but looks wrong

**Problem:** Email client compatibility or missing images

**Solution:**
1. Verify logo exists: `http://localhost:3000/uploads/content/images/kemetraLogo.png`
2. Check API_URL in .env file
3. Test in different email clients (Gmail, Outlook, etc.)

## Support

**API Documentation:** http://localhost:3000/api/docs

**Endpoint Details:**
- Path: `POST /api/v1/admin/newsletter/send`
- Auth: Required (JWT Bearer token)
- Body: None
- Rate Limit: 10 requests per hour

**Response Format:**
```typescript
interface NewsletterResponse {
  data: {
    campaignId: string;
    recipientCount: number;
    successCount: number;
    failureCount: number;
  };
  message: string;
}
```

---

**Last Updated:** January 25, 2026
**Backend Version:** 2.0.0
**Status:** ✅ Ready for Admin Panel Integration
