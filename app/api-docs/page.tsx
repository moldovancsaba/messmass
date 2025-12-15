import { Metadata } from 'next';
import styles from '../admin/help/page.module.css';

export const metadata: Metadata = {
  title: 'API Documentation - MessMass',
  description: 'Complete API documentation for MessMass integrations',
};

export default function APIDocsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>📚 MessMass API Documentation</h1>
          <p className={styles.subtitle}>
            Complete guide for integrating with MessMass APIs
          </p>
        </header>

        <nav className={styles.toc}>
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#authentication">Authentication</a></li>
            <li><a href="#public-api">Public API (Read)</a></li>
            <li><a href="#fanmass-integration">Fanmass Integration</a></li>
            <li><a href="#webhooks">Webhooks</a></li>
            <li><a href="#error-codes">Error Codes</a></li>
            <li><a href="#rate-limiting">Rate Limiting</a></li>
            <li><a href="#examples">Code Examples</a></li>
          </ul>
        </nav>

        <section id="overview" className={styles.section}>
          <h2>🌐 Overview</h2>
          
          <h3>Available APIs</h3>
          <p>MessMass provides several API endpoints for different use cases:</p>
          <ul>
            <li><strong>Public API (Read):</strong> Retrieve event and partner data</li>
            <li><strong>Public API (Write):</strong> Inject external data (e.g., fan identification)</li>
            <li><strong>Webhooks:</strong> Real-time notifications for event changes</li>
            <li><strong>Admin API:</strong> Internal management endpoints (admin only)</li>
          </ul>

          <h3>Base URLs</h3>
          <div className={styles.codeBlock}>
            Production: https://messmass.com<br />
            Staging: https://messmass-staging.vercel.app
          </div>

          <h3>Data Format</h3>
          <ul>
            <li>All requests and responses use <code>application/json</code></li>
            <li>Timestamps are in ISO 8601 format (UTC)</li>
            <li>IDs are MongoDB ObjectIds (24-character hex strings)</li>
          </ul>
        </section>

        <section id="authentication" className={styles.section}>
          <h2>🔐 Authentication</h2>
          
          <h3>Bearer Token Authentication</h3>
          <p>All API requests require a Bearer token in the Authorization header:</p>
          <div className={styles.codeBlock}>
            Authorization: Bearer YOUR_API_TOKEN_HERE
          </div>

          <h3>Getting an API Token</h3>
          <ol>
            <li>Contact your MessMass administrator</li>
            <li>Admin creates an API user in <code>/admin/users</code></li>
            <li>Admin enables <code>apiKeyEnabled</code> flag</li>
            <li>The user password becomes your Bearer token</li>
          </ol>

          <h3>Permission Levels</h3>
          <ul>
            <li><strong>Read Access:</strong> <code>apiKeyEnabled = true</code></li>
            <li><strong>Write Access:</strong> <code>apiKeyEnabled = true</code> AND <code>apiWriteEnabled = true</code></li>
          </ul>

          <h3>Security Best Practices</h3>
          <ul>
            <li>Never commit API tokens to version control</li>
            <li>Store tokens in environment variables</li>
            <li>Use HTTPS for all API requests</li>
            <li>Rotate tokens periodically</li>
          </ul>
        </section>

        <section id="public-api" className={styles.section}>
          <h2>📖 Public API (Read)</h2>
          
          <h3>Get Event by ID</h3>
          <div className={styles.codeBlock}>
            GET /api/public/events/[id]
          </div>
          
          <h4>Parameters</h4>
          <ul>
            <li><code>id</code> (path): Event ObjectId</li>
            <li><code>includeStats</code> (query, optional): Include full stats object (default: true)</li>
          </ul>

          <h4>Response</h4>
          <div className={styles.codeBlock}>
{`{
  "success": true,
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "eventName": "FC Barcelona vs Real Madrid",
    "eventDate": "2024-12-01T20:00:00Z",
    "viewSlug": "barcelona-madrid-2024",
    "editSlug": "edit-barcelona-madrid-2024",
    "hashtags": ["soccer", "laliga"],
    "partner": {
      "id": "507f1f77bcf86cd799439012",
      "name": "FC Barcelona",
      "emoji": "⚽"
    },
    "stats": {
      "male": 1000,
      "female": 800,
      "remoteFans": 500,
      "stadium": 1500,
      "totalFans": 2000,
      ...
    },
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-26T15:30:00Z"
  },
  "timestamp": "2024-11-26T15:30:00.000Z"
}`}
          </div>

          <h3>Get Partner by ID</h3>
          <div className={styles.codeBlock}>
            GET /api/public/partners/[id]
          </div>
          
          <h4>Response</h4>
          <div className={styles.codeBlock}>
{`{
  "success": true,
  "partner": {
    "id": "507f1f77bcf86cd799439012",
    "name": "FC Barcelona",
    "emoji": "⚽",
    "hashtags": ["soccer", "laliga"],
    "eventCount": 25,
    "totalStats": {
      "totalFans": 50000,
      "totalImages": 15000,
      ...
    }
  },
  "timestamp": "2024-11-26T15:30:00.000Z"
}`}
          </div>
        </section>

        <section id="fanmass-integration" className={styles.section}>
          <h2>🎯 Fanmass Integration</h2>
          
          <h3>Overview</h3>
          <p>
            The Fanmass integration allows external fan identification services to inject enriched data back into MessMass events.
          </p>

          <h3>Write Stats Data</h3>
          <div className={styles.codeBlock}>
            POST /api/public/events/[id]/stats
          </div>

          <h4>Authentication</h4>
          <p>Requires both <code>apiKeyEnabled</code> AND <code>apiWriteEnabled</code> flags.</p>

          <h4>Request Body</h4>
          <div className={styles.codeBlock}>
{`{
  "stats": {
    "male": 1200,
    "female": 950,
    "genAlpha": 150,
    "genYZ": 800,
    "genX": 600,
    "boomer": 600,
    "merched": 400,
    "jersey": 200,
    "remoteFans": 600
  },
  "source": "fanmass",
  "metadata": {
    "confidence": 0.95,
    "processingTime": 1234,
    "version": "2.0"
  }
}`}
          </div>

          <h4>Valid KYC Fields</h4>
          <p><strong>Demographics:</strong></p>
          <ul>
            <li><code>male</code>, <code>female</code></li>
            <li><code>genAlpha</code>, <code>genYZ</code>, <code>genX</code>, <code>boomer</code></li>
          </ul>

          <p><strong>Merchandise:</strong></p>
          <ul>
            <li><code>merched</code>, <code>jersey</code>, <code>scarf</code>, <code>flags</code>, <code>baseballCap</code>, <code>other</code></li>
          </ul>

          <p><strong>Fan Counts:</strong></p>
          <ul>
            <li><code>remoteFans</code>, <code>stadium</code>, <code>indoor</code>, <code>outdoor</code></li>
          </ul>

          <p><strong>Image Counts:</strong></p>
          <ul>
            <li><code>remoteImages</code>, <code>hostessImages</code>, <code>selfies</code></li>
          </ul>

          <h4>Validation Rules</h4>
          <ul>
            <li>All values must be <strong>non-negative integers</strong></li>
            <li>Field names must be from the valid KYC fields list</li>
            <li>No null or undefined values</li>
            <li>Decimal values are rejected</li>
            <li>Values &gt; 1,000,000 generate warnings but are accepted</li>
          </ul>

          <h4>Response (Success)</h4>
          <div className={styles.codeBlock}>
{`{
  "success": true,
  "updatedFields": ["male", "female", "genAlpha", "genYZ", "merched", "remoteFans"],
  "warnings": [],
  "timestamp": "2024-11-26T15:30:00.000Z"
}`}
          </div>

          <h4>Response (Validation Error)</h4>
          <div className={styles.codeBlock}>
{`{
  "success": false,
  "error": "Invalid stats data",
  "errorCode": "INVALID_STATS_DATA",
  "details": [
    "Field \\"male\\" must be non-negative, got -10",
    "Invalid field name: \\"invalidField\\""
  ],
  "timestamp": "2024-11-26T15:30:00.000Z"
}`}
          </div>

          <h3>Derived Metrics</h3>
          <p>The following metrics are automatically calculated:</p>
          <ul>
            <li><code>totalFans = remoteFans + stadium + indoor + outdoor</code></li>
            <li><code>totalImages = remoteImages + hostessImages + selfies</code></li>
          </ul>

          <h3>Audit Logging</h3>
          <p>All write operations are logged with:</p>
          <ul>
            <li>Event ID and user email</li>
            <li>Timestamp and IP address</li>
            <li>Before/after values for each changed field</li>
            <li>Source and metadata</li>
          </ul>
        </section>

        <section id="webhooks" className={styles.section}>
          <h2>🔔 Webhooks</h2>
          
          <h3>Overview</h3>
          <p>
            Webhooks allow you to receive real-time notifications when events are created or updated in MessMass.
          </p>

          <h3>Webhook Configuration</h3>
          <p>Contact your administrator to register a webhook with:</p>
          <ul>
            <li><strong>URL:</strong> HTTPS endpoint (HTTP not allowed)</li>
            <li><strong>Event Types:</strong> <code>event.created</code>, <code>event.updated</code></li>
            <li><strong>Secret:</strong> Auto-generated for signature verification</li>
          </ul>

          <h3>Webhook Payload</h3>
          <div className={styles.codeBlock}>
{`{
  "event": "event.created",
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
}`}
          </div>

          <h3>Signature Verification</h3>
          <p>Every webhook includes an <code>X-Webhook-Signature</code> header:</p>
          <div className={styles.codeBlock}>
{`// Node.js example
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
  const isValid = verifyWebhookSignature(
    req.body, 
    signature, 
    YOUR_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.status(200).json({ received: true });
});`}
          </div>

          <h3>Retry Logic</h3>
          <ul>
            <li><strong>Attempt 1:</strong> Immediate</li>
            <li><strong>Attempt 2:</strong> After 1 second</li>
            <li><strong>Attempt 3:</strong> After 5 seconds</li>
            <li><strong>Attempt 4:</strong> After 15 seconds</li>
          </ul>
          <p>After 10 consecutive failures, the webhook is automatically disabled.</p>

          <h3>Timeout</h3>
          <p>Each delivery attempt has a 10-second timeout.</p>
        </section>

        <section id="error-codes" className={styles.section}>
          <h2>⚠️ Error Codes</h2>
          
          <h3>Authentication Errors (401)</h3>
          <ul>
            <li><code>MISSING_TOKEN</code> - No Authorization header provided</li>
            <li><code>INVALID_TOKEN</code> - Bearer token not found in database</li>
            <li><code>API_ACCESS_DISABLED</code> - User has apiKeyEnabled=false</li>
          </ul>

          <h3>Permission Errors (403)</h3>
          <ul>
            <li><code>WRITE_ACCESS_DISABLED</code> - User has apiWriteEnabled=false</li>
            <li><code>COOKIES_NOT_ALLOWED</code> - Request included cookies (not allowed for API)</li>
          </ul>

          <h3>Validation Errors (400)</h3>
          <ul>
            <li><code>INVALID_EVENT_ID</code> - Event ID format is invalid</li>
            <li><code>INVALID_STATS_DATA</code> - Stats validation failed</li>
            <li><code>NEGATIVE_VALUE</code> - Numeric value is negative</li>
            <li><code>INVALID_TYPE</code> - Field has wrong data type</li>
            <li><code>MISSING_REQUIRED_FIELD</code> - Required field is missing</li>
          </ul>

          <h3>Not Found Errors (404)</h3>
          <ul>
            <li><code>EVENT_NOT_FOUND</code> - Event does not exist</li>
            <li><code>PARTNER_NOT_FOUND</code> - Partner does not exist</li>
          </ul>

          <h3>Rate Limiting (429)</h3>
          <ul>
            <li><code>RATE_LIMIT_EXCEEDED</code> - Too many requests (1000/min limit)</li>
          </ul>

          <h3>Server Errors (500)</h3>
          <ul>
            <li><code>INTERNAL_ERROR</code> - Unexpected server error</li>
            <li><code>DATABASE_ERROR</code> - Database operation failed</li>
          </ul>
        </section>

        <section id="rate-limiting" className={styles.section}>
          <h2>⏱️ Rate Limiting</h2>
          
          <h3>Limits</h3>
          <ul>
            <li><strong>Authenticated Users:</strong> 1000 requests per minute</li>
            <li><strong>Per IP:</strong> Shared across all API users from same IP</li>
          </ul>

          <h3>Headers</h3>
          <p>Rate limit information is included in response headers:</p>
          <div className={styles.codeBlock}>
            X-RateLimit-Limit: 1000<br />
            X-RateLimit-Remaining: 995<br />
            X-RateLimit-Reset: 1638360000
          </div>

          <h3>Handling Rate Limits</h3>
          <ul>
            <li>Implement exponential backoff</li>
            <li>Cache responses when possible</li>
            <li>Use webhooks instead of polling</li>
            <li>Contact admin if you need higher limits</li>
          </ul>
        </section>

        <section id="examples" className={styles.section}>
          <h2>💻 Code Examples</h2>
          
          <h3>JavaScript/Node.js</h3>
          <div className={styles.codeBlock}>
{`// Read event data
const response = await fetch(
  'https://messmass.com/api/public/events/507f1f77bcf86cd799439011',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.event);

// Write stats data
const writeResponse = await fetch(
  'https://messmass.com/api/public/events/507f1f77bcf86cd799439011/stats',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stats: {
        male: 1200,
        female: 950,
        remoteFans: 600
      },
      source: 'my-service',
      metadata: {
        confidence: 0.95
      }
    })
  }
);

const writeData = await writeResponse.json();
console.log('Updated fields:', writeData.updatedFields);`}
          </div>

          <h3>Python</h3>
          <div className={styles.codeBlock}>
{`import requests

# Read event data
response = requests.get(
    'https://messmass.com/api/public/events/507f1f77bcf86cd799439011',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
    }
)

data = response.json()
print(data['event'])

# Write stats data
write_response = requests.post(
    'https://messmass.com/api/public/events/507f1f77bcf86cd799439011/stats',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
    },
    json={
        'stats': {
            'male': 1200,
            'female': 950,
            'remoteFans': 600
        },
        'source': 'my-service',
        'metadata': {
            'confidence': 0.95
        }
    }
)

write_data = write_response.json()
print('Updated fields:', write_data['updatedFields'])`}
          </div>

          <h3>cURL</h3>
          <div className={styles.codeBlock}>
{`# Read event data
curl -X GET \\
  'https://messmass.com/api/public/events/507f1f77bcf86cd799439011' \\
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\
  -H 'Content-Type: application/json'

# Write stats data
curl -X POST \\
  'https://messmass.com/api/public/events/507f1f77bcf86cd799439011/stats' \\
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "stats": {
      "male": 1200,
      "female": 950,
      "remoteFans": 600
    },
    "source": "my-service",
    "metadata": {
      "confidence": 0.95
    }
  }'`}
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            <strong>MessMass API Documentation</strong><br />
            Last Updated: November 26, 2024
          </p>
          <p>
            <strong>Additional Resources:</strong><br />
            <a href="/admin/help">User Guide</a>
            {' '}•{' '}
            <a href="https://github.com/moldovancsaba/messmass" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
          </p>
          <p>
            For API access or technical support, contact your system administrator.
          </p>
        </footer>
      </div>
    </div>
  );
}
