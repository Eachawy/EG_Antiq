# Email Setup Guide for Password Reset

## Overview

The application now sends password reset tokens via email and notifies users when their password is changed. This guide explains how to configure email functionality.

## Features Implemented

✅ **Password Reset Email** - Sends reset link to user's email
✅ **Password Changed Notification** - Confirms successful password change
✅ **Professional HTML Templates** - Beautiful, responsive email templates
✅ **Security Best Practices** - Token hashing, expiration, one-time use
✅ **Email Verification** - Validates SMTP connection on startup

---

## Email Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourcompany.com
EMAIL_FROM_NAME=Your Company Name
FRONTEND_URL=http://localhost:3000
```

### Configuration Details

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `EMAIL_SECURE` | Use SSL/TLS | `false` for port 587, `true` for 465 |
| `EMAIL_USER` | SMTP username | Your email address |
| `EMAIL_PASSWORD` | SMTP password | App-specific password (see below) |
| `EMAIL_FROM` | From email address | `noreply@yourcompany.com` |
| `EMAIL_FROM_NAME` | Sender name | `EG Antiq` |
| `FRONTEND_URL` | Your frontend URL | `https://yourapp.com` |

---

## Email Provider Setup

### Option 1: Gmail

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll to "App passwords"
   - Generate a password for "Mail"
3. **Configure .env**:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Option 2: SendGrid

1. **Sign up** at https://sendgrid.com
2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Full Access
3. **Configure .env**:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=verified-sender@yourdomain.com
```

### Option 3: AWS SES

1. **Verify Email** in AWS SES Console
2. **Get SMTP Credentials**:
   - SMTP Settings → Create SMTP Credentials
3. **Configure .env**:
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
```

### Option 4: Mailgun

1. **Sign up** at https://mailgun.com
2. **Get SMTP Credentials**:
   - Domains → Select Domain → SMTP Credentials
3. **Configure .env**:
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

### Option 5: Development/Testing (Mailtrap)

For development, use Mailtrap to test emails without sending real ones:

1. **Sign up** at https://mailtrap.io
2. **Get SMTP Credentials** from your inbox
3. **Configure .env**:
```bash
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```

---

## Email Templates

### Password Reset Email

**Subject:** Password Reset Request

**Features:**
- Responsive HTML design
- Clear call-to-action button
- Clickable reset link
- 1-hour expiration warning
- Security notice if not requested

**Example:**
```
Hello John,

You requested to reset your password. Click the button below to create a new password:

[Reset Password Button]

Or copy and paste this link:
http://localhost:3000/reset-password?token=abc123...

⚠️ Important: This link will expire in 1 hour.

If you did not request this, please ignore this email.
```

### Password Changed Notification

**Subject:** Your Password Has Been Changed

**Features:**
- Success confirmation
- Security alert if unauthorized
- List of security actions taken
- Timestamp of change

**Example:**
```
Hello John,

✓ Success: Your password has been changed successfully.

⚠️ Didn't make this change?
If you did not authorize this password change, please contact support immediately.

For your security:
• All existing sessions have been logged out
• You'll need to log in again with your new password
• Make sure your new password is strong and unique

Date: 12/21/2025, 3:30:00 AM
```

---

## API Usage

### Step 1: Request Password Reset

```bash
curl -X POST http://localhost:3000/api/v1/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Response:**
```json
{
  "message": "If your email exists in our system, you will receive a password reset email"
}
```

**What Happens:**
1. System finds user by email
2. Generates secure reset token
3. Hashes and stores token in database
4. Sends email with reset link
5. Returns success (regardless of email existence for security)

### Step 2: User Receives Email

User receives an email with a link like:
```
http://localhost:3000/reset-password?token=af14158c7c71b2b068c7a7134a3ef3f2620f01067d41a80bbe5eeadfcafe2c47
```

### Step 3: Reset Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "af14158c7c71b2b068c7a7134a3ef3f2620f01067d41a80bbe5eeadfcafe2c47",
    "newPassword": "mynewpassword123"
  }'
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

**What Happens:**
1. Token is validated (hash match + not expired)
2. Password is updated (bcrypt hash)
3. Reset token is cleared from database
4. All refresh tokens are revoked
5. **Email notification is sent**
6. User must login with new password

---

## Testing

### Test Email Configuration

You can verify your email configuration works by requesting a password reset for a test user:

```bash
# 1. Create a test user (if needed)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Request password reset
curl -X POST http://localhost:3000/api/v1/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 3. Check your email inbox for the reset link
# 4. Use the token from email to reset password
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "newPassword": "newpassword123"
  }'

# 5. Check inbox again for password changed confirmation
```

### Expected Logs

When password reset is requested, you'll see:
```
[INFO] Password reset token generated { userId: '...', email: '...' }
[INFO] Password reset email sent successfully { email: '...' }
```

When password is reset, you'll see:
```
[INFO] Password reset successfully { userId: '...', email: '...' }
[INFO] Password changed notification email sent successfully { email: '...' }
```

---

## Frontend Integration

### Reset Password Page

Your frontend should have a `/reset-password` page that:

1. **Extracts token** from URL query parameter
2. **Shows form** for new password input
3. **Calls API** with token and new password
4. **Redirects to login** on success

**Example React Component:**
```jsx
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      if (response.ok) {
        alert('Password reset successfully! Please login with your new password.');
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      {error && <div className="error">{error}</div>}

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        minLength={8}
        required
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        minLength={8}
        required
      />

      <button type="submit">Reset Password</button>
    </form>
  );
}
```

---

## Troubleshooting

### Email Not Sending

**Check logs for errors:**
```bash
# Look for email-related errors in server logs
```

**Common issues:**
1. **Wrong SMTP credentials** - Verify username/password
2. **Port blocked** - Try port 465 with `EMAIL_SECURE=true`
3. **Gmail blocking** - Enable "Less secure app access" or use App Password
4. **Firewall** - Ensure outbound SMTP connections allowed

**Test SMTP connection manually:**
```bash
# In Node.js console
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your-email', pass: 'your-password' }
});
transporter.verify().then(console.log).catch(console.error);
```

### Email Goes to Spam

1. **Set up SPF record** for your domain
2. **Set up DKIM** authentication
3. **Use verified sender** email address
4. **Avoid spam trigger words** in email content
5. **Use reputable email service** (SendGrid, AWS SES)

### Token Expired

- Tokens expire after 1 hour
- User must request a new reset link
- Old tokens are automatically invalidated

---

## Security Considerations

### Current Implementation

✅ Tokens are hashed (SHA-256) before database storage
✅ Tokens expire after 1 hour
✅ Tokens are single-use (cleared on successful reset)
✅ All sessions revoked on password change
✅ Email enumeration prevention
✅ Minimum password length enforced

### Production Recommendations

1. **Rate Limiting**
   - Limit password reset requests per email (5/hour)
   - Limit requests per IP (20/hour)

2. **Monitoring**
   - Alert on multiple failed reset attempts
   - Log all password changes with IP address
   - Monitor for suspicious patterns

3. **Email Content**
   - Don't reveal user information in emails
   - Include timestamp and IP of request
   - Provide support contact

4. **Additional Verification**
   - Consider security questions
   - Implement 2FA
   - Require email verification before allowing password change

---

## Files Modified

### Created:
- `/src/common/services/email.service.ts` - Email service with nodemailer
- `/EMAIL_SETUP_GUIDE.md` - This guide

### Modified:
- `/src/config/index.ts` - Added email configuration
- `/src/modules/auth/auth.service.ts` - Integrated EmailService
- `/src/modules/auth/auth.controller.ts` - Updated response messages
- `/src/modules/auth/auth.module.ts` - Added EmailService provider
- `/src/app.module.ts` - Registered EmailService globally
- `/.env` - Added email variables
- `/package.json` - Added nodemailer dependency

---

## Next Steps

1. **Configure Email Provider** - Set up SMTP credentials
2. **Test Locally** - Use Mailtrap for development
3. **Customize Templates** - Update email templates to match your brand
4. **Deploy** - Use production email service (SendGrid/SES)
5. **Monitor** - Set up alerts for email failures

---

## Support

For email-related issues:
- Check application logs for error messages
- Verify SMTP credentials are correct
- Test connection with provider's tools
- Contact your email provider support
