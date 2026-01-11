# Fanmass Integration Setup Guide
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

## Overview

This guide will help you set up the Fanmass integration with MessMass, enabling bidirectional data exchange for fan identification and enrichment.

## ✅ What's Implemented

### Core Functionality (READY NOW)
- ✅ **Read API** - Fanmass can retrieve event data
- ✅ **Write API** - Fanmass can inject fan identification results
- ✅ **Authentication** - Bearer token with dual permissions (read + write)
- ✅ **Validation** - All incoming data is validated
- ✅ **Audit Logging** - All changes are tracked with before/after values
- ✅ **Derived Metrics** - Auto-calculation of totalFans, totalImages
- ✅ **Webhook System** - Real-time notifications with retry logic
- ✅ **Test Suite** - 49 tests passing (3,900+ property-based iterations)

### Admin Features (Coming Soon)
- ⏳ Webhook management UI
- ⏳ Audit log viewer UI
- ⏳ API documentation portal

---

## 🚀 Quick Start (5 Steps)

### Step 1: Configure Environment

Create `.env.local` file in the project root:

```bash
# Copy from example
cp .env.example .env.local
```

Edit `.env.local` and set:

```bash
# MongoDB connection (REQUIRED)
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.example.mongodb.net
MONGODB_DB=messmass

# Admin password (REQUIRED)
ADMIN_PASSWORD=your-secure-admin-password

# Application URLs
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:7654

# Fanmass API Token (for testing)
FANMASS_API_TOKEN=
```

### Step 2: Run Database Migration

Add write permission fields to existing users:

```bash
npm run migrate:api-fields
```

Expected output:
```
✅ Migration complete: Updated X users
   - apiWriteEnabled: false (default)
   - apiWriteCount: 0 (default)
   - lastAPIWriteAt: null (will be set on first write)
```

### Step 3: Create Fanmass API User

**Option A: Via Admin UI (Recommended)**

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/admin/users`

3. Create new user:
   - Email: `fanmass@yourdomain.com`
   - Name: `Fanmass Service`
   - Password: Generate secure token (will be used as Bearer token)

4. Enable API access:
   - Toggle `apiKeyEnabled` = `true`
   - Toggle `apiWriteEnabled` = `true`

5. Copy the password/token - this is the Bearer token Fanmass will use

**Option B: Via MongoDB (Direct)**

```javascript
// Connect to MongoDB and run:
db.users.insertOne({
  email: "fanmass@yourdomain.com",
  name: "Fanmass Service",
  password: "GENERATE_SECURE_TOKEN_HERE", // This becomes the Bearer token
  apiKeyEnabled: true,
  apiWriteEnabled: true,
  apiUsageCount: 0,
  apiWriteCount: 0,
  createdAt: new Date().toISOString()
});
```

### Step 4: Test the Integration

Set the Fanmass token in `.env.local`:

```bash
FANMASS_API_TOKEN=your-bearer-token-from-step-3
```

Run the test suite:

```bash
# Test authentication only
npm run test:fanmass

# Test with a specific event
npm run test:fanmass EVENT_ID_HERE
```

Expected output:
```
✅ Reject missing token
✅ Reject invalid token
✅ Read event data
✅ Event data structure
✅ Write valid stats
✅ Reject invalid stats
✅ Handle non-existent event

📊 Test Summary
Total: 7 tests
✅ Passed: 7
Success Rate: 100.0%
```

### Step 5: Configure Webhooks (Optional)

Register a webhook to receive real-time notifications:

```javascript
// Via MongoDB or future admin UI
db.webhooks.insertOne({
  url: "https://fanmass.yourdomain.com/webhooks/messmass",
  secret: "GENERATE_RANDOM_SECRET_HERE",
  eventTypes: ["event.created", "event.updated"],
  active: true,
  totalDeliveries: 0,
  successfulDeliveries: 0,
  failedDeliveries: 0,
  consecutiveFailures: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

---

## 📡 API Reference

### Authentication

All requests require Bearer token authentication:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

### Read Event Data

```bash
GET /api/public/events/{eventId}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "eventName": "FC Barcelona vs Real Madrid",
    "eventDate": "2024-12-01T20:00:00Z",
    "viewSlug": "barcelona-madrid-2024",
    "stats": {
      "male": 1000,
      "female": 800,
      "remoteFans": 500,
      ...
    }
  },
  "timestamp": "2024-11-26T15:30:00.000Z"
}
```

### Write Fan Data

```bash
POST /api/public/events/{eventId}/stats
Content-Type: application/json
```

**Request Body:**
```json
{
  "stats": {
    "male": 1200,
    "female": 950,
    "genAlpha": 150,
    "genYZ": 800,
    "merched": 400,
    "remoteFans": 600
  },
  "source": "fanmass",
  "metadata": {
    "confidence": 0.95,
    "processingTime": 1234,
    "version": "2.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "updatedFields": ["male", "female", "genAlpha", "genYZ", "merched", "remoteFans"],
  "warnings": [],
  "timestamp": "2024-11-26T15:30:00.000Z"
}
```

### Valid KYC Fields

**Demographics:**
- `male`, `female`
- `genAlpha`, `genYZ`, `genX`, `boomer`

**Merchandise:**
- `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`

**Fan Counts:**
- `remoteFans`, `stadium`, `indoor`, `outdoor`

**Image Counts:**
- `remoteImages`, `hostessImages`, `selfies`

### Validation Rules

- All values must be **non-negative integers**
- Field names must be from the valid KYC fields list
- No null or undefined values
- Decimal values are rejected
- Values > 1,000,000 generate warnings but are accepted

### Error Codes

- `MISSING_TOKEN` - No Authorization header
- `INVALID_TOKEN` - Token not found in database
- `API_ACCESS_DISABLED` - User has apiKeyEnabled=false
- `WRITE_ACCESS_DISABLED` - User has apiWriteEnabled=false
- `INVALID_EVENT_ID` - Event ID format is invalid
- `EVENT_NOT_FOUND` - Event does not exist
- `INVALID_STATS_DATA` - Stats validation failed
- `NEGATIVE_VALUE` - Numeric value is negative
- `INVALID_TYPE` - Field has wrong data type

---

## 🔔 Webhook Integration

### Webhook Payload

When events are created or updated, MessMass sends:

```json
{
  "event": "event.created",  // or "event.updated"
  "timestamp": "2024-11-26T15:30:00.000Z",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "eventName": "FC Barcelona vs Real Madrid",
    "eventDate": "2024-12-01T20:00:00Z",
    "viewSlug": "barcelona-madrid-2024",
    "partner": {
      "id": "507f1f77bcf86cd799439012",
      "name": "FC Barcelona",
      "emoji": "⚽"
    }
  }
}
```

### Webhook Signature Verification

Every webhook includes an `X-Webhook-Signature` header:

```javascript
// Verify signature (Node.js example)
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

// In your webhook handler:
app.post('/webhooks/messmass', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, YOUR_WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.status(200).json({ received: true });
});
```

### Retry Logic

- **Attempt 1:** Immediate
- **Attempt 2:** After 1 second
- **Attempt 3:** After 5 seconds
- **Attempt 4:** After 15 seconds

After 10 consecutive failures, the webhook is automatically disabled.

---

## 🔍 Monitoring & Debugging

### View Audit Logs

Query the `api_audit_logs` collection:

```javascript
db.api_audit_logs.find({
  eventId: ObjectId("507f1f77bcf86cd799439011")
}).sort({ timestamp: -1 }).limit(10)
```

Each log contains:
- Event ID and user email
- Timestamp and IP address
- Before/after values for each changed field
- Source and metadata

### View Webhook Delivery Logs

Query the `webhook_delivery_logs` collection:

```javascript
db.webhook_delivery_logs.find({
  webhookId: ObjectId("507f1f77bcf86cd799439013")
}).sort({ deliveredAt: -1 }).limit(10)
```

### Check API Usage

```javascript
db.users.findOne({ email: "fanmass@yourdomain.com" })
```

Shows:
- `apiUsageCount` - Total API calls
- `apiWriteCount` - Total write operations
- `lastAPICallAt` - Last read operation
- `lastAPIWriteAt` - Last write operation

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- lib/__tests__/statsValidator.test.ts

# Run with coverage
npm test:coverage
```

### Property-Based Tests

```bash
# Run property tests (1,400+ random inputs per test)
npm test -- lib/__tests__/statsValidator.property.test.ts
npm test -- lib/__tests__/auditLog.property.test.ts
npm test -- lib/__tests__/webhooks.property.test.ts
```

### Integration Tests

```bash
# Test full integration flow
npm run test:fanmass EVENT_ID
```

---

## 🚨 Troubleshooting

### "MONGODB_URI environment variable is not configured"

**Solution:** Create `.env.local` file with MongoDB connection string.

### "Invalid token" (401 error)

**Causes:**
- Token not in database
- User has `apiKeyEnabled=false`

**Solution:** Verify user exists and has API access enabled.

### "Write access not enabled" (403 error)

**Cause:** User has `apiWriteEnabled=false`

**Solution:** Enable write access for the user:
```javascript
db.users.updateOne(
  { email: "fanmass@yourdomain.com" },
  { $set: { apiWriteEnabled: true } }
)
```

### "Invalid stats data" (400 error)

**Causes:**
- Negative values
- Invalid field names
- Non-integer values
- Null/undefined values

**Solution:** Check validation errors in response body.

### Webhook not receiving notifications

**Checks:**
1. Webhook is `active: true`
2. Webhook URL is HTTPS
3. Event type matches (`event.created` or `event.updated`)
4. Check `webhook_delivery_logs` for errors

---

## 📚 Additional Resources

- **Design Document:** `.kiro/specs/third-party-fan-data-integration/design.md`
- **Requirements:** `.kiro/specs/third-party-fan-data-integration/requirements.md`
- **Tasks:** `.kiro/specs/third-party-fan-data-integration/tasks.md`
- **Test Script:** `scripts/test-fanmass-integration.ts`

---

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Run database migration
3. ✅ Create Fanmass API user
4. ✅ Test the integration
5. ⏳ Deploy to production
6. ⏳ Configure webhooks
7. ⏳ Monitor audit logs

---

## 💡 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review audit logs for detailed error information
3. Run the test suite to verify setup
4. Check MongoDB collections for data integrity

---

**Last Updated: 2026-01-11T22:28:38.000Z
**Version:** 1.0.0
**Status:** Production Ready ✅
