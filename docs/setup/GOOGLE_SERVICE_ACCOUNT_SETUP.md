# Google Service Account Setup - Quick Guide
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Operations

**Time Required**: 5 minutes  
**Purpose**: Create service account for Google Sheets API access

---

## Step-by-Step Instructions

### 1. Go to Google Cloud Console

Open: https://console.cloud.google.com

### 2. Select or Create Project

- If you have an existing project (from SSO), you can reuse it
- Or create new project: Click project dropdown → "New Project"
- Name: `messmass` or `messmass-sheets`

### 3. Enable Google Sheets API

1. In left sidebar: **APIs & Services** → **Library**
2. Search: `Google Sheets API`
3. Click the result
4. Click **"Enable"**

### 4. Create Service Account

1. In left sidebar: **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. **Service account details**:
   - Name: `messmass-sync`
   - Description: `Service account for MessMass Google Sheets integration`
   - Click **"Create and Continue"**
4. **Grant access** (optional):
   - Skip this step (no roles needed)
   - Click **"Continue"**
5. **Grant users access** (optional):
   - Skip this step
   - Click **"Done"**

### 5. Create and Download Key

1. Find your new service account in the list
2. Click on the service account email
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **JSON** format
6. Click **"Create"**
7. JSON file downloads automatically
8. **IMPORTANT**: Keep this file secure! Never commit to git!

### 6. Extract Credentials

Open the downloaded JSON file (e.g., `messmass-sync-abc123.json`):

```json
{
  "type": "service_account",
  "project_id": "messmass-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n",
  "client_email": "messmass-sync@messmass-12345.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

**Copy these two values**:
1. `client_email` → This is your `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`
2. `private_key` → This is your `GOOGLE_SHEETS_PRIVATE_KEY`

### 7. Add to `.env.local`

```bash
# Google Sheets Integration (v12.0.0)
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=messmass-sync@messmass-12345.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important**:
- Keep the quotes around the private key
- Preserve the `\n` characters (they represent newlines)
- Don't remove any part of the key

### 8. Share Google Sheets with Service Account

For each Google Sheet you want to sync:

1. Open the Google Sheet
2. Click **"Share"** button (top-right)
3. Paste the service account email:
   ```
   messmass-sync@messmass-12345.iam.gserviceaccount.com
   ```
4. Set permission: **Editor**
5. **Uncheck** "Notify people"
6. Click **"Done"**

---

## ✅ Verification

Run the test script to verify everything works:

```bash
cd /Users/moldovancsaba/Projects/messmass
npm run test:google-sheets
```

Expected output:
```
🚀 Google Sheets API Integration Tests
======================================
🔐 Testing authentication...
✅ Authentication successful - client created
```

---

## 🔒 Security Best Practices

1. **Never commit the JSON key file to git**
   - Add to `.gitignore`: `*.json` (if not already)
   - Store securely (password manager, 1Password, etc.)

2. **Rotate keys periodically**
   - Delete old keys in Google Cloud Console
   - Create new key every 90 days

3. **Limit sheet access**
   - Only share sheets that need sync
   - Don't share entire Drive folders

4. **Monitor usage**
   - Check Google Cloud Console → APIs & Services → Dashboard
   - Review API quota and errors

---

## 🆘 Troubleshooting

**"Missing Google Sheets credentials"**
- Check that both env vars are set
- Restart dev server after adding vars

**"The caller does not have permission"**
- Ensure sheet is shared with service account email
- Set permission to "Editor" (not Viewer)

**"Invalid JWT signature"**
- Private key format issue
- Make sure `\n` characters are preserved
- Keep quotes around the key

**"API not enabled"**
- Go to APIs & Services → Library
- Enable "Google Sheets API"

---

**Time to complete**: ~5 minutes  
**Next step**: Run `npm run test:google-sheets`
