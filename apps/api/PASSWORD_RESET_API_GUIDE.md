# Password Reset API Guide

## Overview

The Password Reset API provides a secure two-step process for users to reset their forgotten passwords. The implementation uses cryptographic tokens with expiration for security.

## Security Features

1. **Token Hashing** - Reset tokens are hashed (SHA-256) before storage in database
2. **Time-Limited Tokens** - Tokens expire after 1 hour
3. **One-Time Use** - Tokens are invalidated after successful password reset
4. **Session Revocation** - All refresh tokens are revoked when password is reset
5. **Email Enumeration Prevention** - Same response whether email exists or not
6. **Minimum Password Length** - 8 characters required

## API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/v1/auth/request-reset-password`

**Authentication:** Public (no token required)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "data": {
    "resetToken": "af14158c7c71b2b068c7a7134a3ef3f2620f01067d41a80bbe5eeadfcafe2c47"
  },
  "message": "If your email exists in our system, you will receive a password reset token"
}
```

**Notes:**
- Returns same success message whether email exists or not (security best practice)
- In production, the token should be sent via email, not returned in response
- Token is valid for 1 hour
- Token is a 64-character hexadecimal string

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

---

### 2. Reset Password

**Endpoint:** `POST /api/v1/auth/reset-password`

**Authentication:** Public (no token required)

**Request Body:**
```json
{
  "token": "af14158c7c71b2b068c7a7134a3ef3f2620f01067d41a80bbe5eeadfcafe2c47",
  "newPassword": "mynewpassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Response (Error - Invalid/Expired Token):**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Password reset token is invalid or has expired"
  },
  "meta": {
    "timestamp": "2025-12-21T03:17:13.593Z",
    "correlationId": "7e4719cc-986b-4ed7-baa4-8c0bcc05adb7",
    "path": "/api/v1/auth/reset-password"
  }
}
```

**Response (Error - Password Too Short):**
```json
{
  "error": {
    "code": "Bad Request",
    "message": ["Password must be at least 8 characters long"]
  },
  "meta": {
    "timestamp": "2025-12-21T03:17:13.593Z",
    "correlationId": "...",
    "path": "/api/v1/auth/reset-password"
  }
}
```

**Notes:**
- Token can only be used once
- After successful reset, all user's refresh tokens are revoked
- User must login again with new password
- Minimum password length is 8 characters

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "af14158c7c71b2b068c7a7134a3ef3f2620f01067d41a80bbe5eeadfcafe2c47",
    "newPassword": "mynewpassword123"
  }'
```

---

## Complete Flow Example

### Step 1: User Requests Password Reset

```bash
curl -X POST http://localhost:3000/api/v1/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Response:**
```json
{
  "data": {
    "resetToken": "af14158c7c71b2b068c7a7134a3ef3f2620f01067d41a80bbe5eeadfcafe2c47"
  },
  "message": "If your email exists in our system, you will receive a password reset token"
}
```

### Step 2: User Receives Token (via email in production)

In production, you would:
1. Send the token via email (not in API response)
2. Include a link like: `https://yourapp.com/reset-password?token=af14158c...`
3. User clicks link and enters new password on your frontend
4. Frontend calls reset-password endpoint

### Step 3: User Resets Password with Token

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

### Step 4: User Logs In with New Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "mynewpassword123"
  }'
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "625f8344-24af-4879-a273-a7fe0e9e2f8a",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["admin"]
    }
  },
  "message": "Login successful"
}
```

---

## Database Schema

The following fields were added to the `users` table:

```sql
resetPasswordToken    VARCHAR(255) NULL,
resetPasswordExpires  TIMESTAMPTZ  NULL
```

**Index:** `resetPasswordToken` is indexed for fast lookup

---

## Implementation Details

### Token Generation

1. Generate random 32 bytes using `crypto.randomBytes(32)`
2. Convert to hexadecimal string (64 characters)
3. Hash with SHA-256 before storing in database
4. Set expiration to current time + 1 hour

### Token Validation

1. Hash the received token with SHA-256
2. Find user where:
   - `resetPasswordToken` matches hashed token
   - `resetPasswordExpires` > current time
3. If not found, return error (invalid or expired)

### Password Update Process

1. Hash new password with bcrypt (10 rounds)
2. Update user's `passwordHash`
3. Clear `resetPasswordToken` and `resetPasswordExpires`
4. Revoke all user's refresh tokens
5. Log the password reset

---

## Production Considerations

### Email Integration

Replace the current return of `resetToken` in response with email sending:

```typescript
// Instead of returning token
return { resetToken };

// Send email
await emailService.sendPasswordResetEmail(user.email, {
  resetUrl: `${config.FRONTEND_URL}/reset-password?token=${resetToken}`,
  userName: user.firstName,
  expiresIn: '1 hour'
});

return { message: 'Password reset email sent' };
```

### Token Expiration

Currently set to 1 hour. Adjust in auth.service.ts:

```typescript
const resetPasswordExpires = new Date();
resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1); // Change this
```

### Security Checklist

- [ ] Implement rate limiting on request-reset-password endpoint
- [ ] Add CAPTCHA to prevent automated abuse
- [ ] Log all password reset attempts
- [ ] Send email notification to user when password is changed
- [ ] Consider additional verification (security questions, 2FA)
- [ ] Monitor for suspicious patterns (many requests for same email)
- [ ] Implement account lockout after X failed attempts

---

## Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| `INVALID_TOKEN` | Password reset token is invalid or has expired | 400 |
| `Bad Request` | Password must be at least 8 characters long | 400 |

---

## Testing

### Test Valid Flow

1. Request reset for existing user
2. Use token within 1 hour
3. Verify password changed
4. Verify old sessions revoked

### Test Invalid Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid-token","newPassword":"newpass123"}'
```

Expected: `INVALID_TOKEN` error

### Test Expired Token

1. Request reset
2. Wait more than 1 hour (or manually update DB expiration)
3. Try to use token

Expected: `INVALID_TOKEN` error

### Test Reused Token

1. Request reset
2. Successfully reset password
3. Try to use same token again

Expected: `INVALID_TOKEN` error

### Test Short Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"valid-token","newPassword":"short"}'
```

Expected: Validation error about password length

---

## Migration Notes

### For Local Database
Already applied via:
```bash
npx prisma db push --skip-generate
npx prisma generate
```

### For Docker Database
When Docker is running, apply with:
```bash
docker exec backend-api npx prisma db push --skip-generate
```

---

## Files Modified/Created

### Created:
- `/src/modules/auth/dto/request-reset-password.dto.ts`
- `/src/modules/auth/dto/reset-password.dto.ts`

### Modified:
- `/prisma/schema.prisma` - Added resetPasswordToken and resetPasswordExpires to User model
- `/src/modules/auth/auth.service.ts` - Added requestPasswordReset() and resetPassword() methods
- `/src/modules/auth/auth.controller.ts` - Added /request-reset-password and /reset-password endpoints

---

## Support

For issues or questions about the password reset API, check:
- Application logs for detailed error messages
- Correlation IDs in error responses for debugging
- User table for token status and expiration
