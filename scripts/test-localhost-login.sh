#!/bin/bash
# scripts/test-localhost-login.sh
# WHAT: Test login flow on localhost with detailed output
# WHY: Diagnose why localhost login fails

echo "🧪 Testing localhost login flow..."
echo ""

# Find the correct port (3000 or 3002)
PORT=3000
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Port 3000 is in use, checking 3002..."
  PORT=3002
fi

BASE_URL="http://localhost:$PORT"
echo "📍 Using: $BASE_URL"
echo ""

# Step 1: Test login API
echo "1️⃣  Testing login API..."
RESPONSE=$(curl -s -i -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"moldovancsaba@gmail.com","password":"0a07432e538de1ece3ad033ca40251a2"}')

echo "$RESPONSE" | head -20
echo ""

# Extract cookie
COOKIE=$(echo "$RESPONSE" | grep -i "set-cookie" | grep "admin-session" | sed 's/set-cookie: //i' | cut -d';' -f1)
echo "🍪 Cookie: $COOKIE"
echo ""

if [ -z "$COOKIE" ]; then
  echo "❌ No cookie was set!"
  exit 1
fi

# Step 2: Test auth check with cookie
echo "2️⃣  Testing auth check with cookie..."
AUTH_RESPONSE=$(curl -s -i "$BASE_URL/api/admin/auth" \
  -H "Cookie: $COOKIE")

echo "$AUTH_RESPONSE"
echo ""

# Check if authenticated
if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Authentication successful!"
else
  echo "❌ Authentication failed even with cookie!"
fi
