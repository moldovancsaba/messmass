#!/bin/bash
# Test complete cookie flow on production

DOMAIN="${1:-messmass.doneisbetter.com}"
EMAIL="moldovancsaba@gmail.com"
PASSWORD="0a07432e538de1ece3ad033ca40251a2"

echo "🧪 Testing cookie flow on: $DOMAIN"
echo "=" | tr '=' '=' | head -c 60 && echo ""
echo ""

# Step 1: Login
echo "1️⃣  POST /api/admin/login"
RESPONSE=$(curl -s -i "https://$DOMAIN/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$RESPONSE" | head -20
echo ""

# Extract cookie
COOKIE=$(echo "$RESPONSE" | grep -i "set-cookie:" | grep "admin-session" | sed 's/set-cookie: //i' | sed 's/;.*//')
echo "🍪 Extracted cookie: ${COOKIE:0:50}..."
echo ""

if [ -z "$COOKIE" ]; then
  echo "❌ No cookie received!"
  exit 1
fi

# Step 2: Test auth with cookie
echo "2️⃣  GET /api/admin/auth (with cookie)"
AUTH_RESPONSE=$(curl -s -i "https://$DOMAIN/api/admin/auth" \
  -H "Cookie: $COOKIE")

echo "$AUTH_RESPONSE"
echo ""

# Check result
if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Authentication SUCCESSFUL!"
else
  echo "❌ Authentication FAILED!"
  echo ""
  echo "Debug: Check if cookie is being sent back correctly"
fi
