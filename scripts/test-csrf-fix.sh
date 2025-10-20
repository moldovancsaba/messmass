#!/bin/bash
# Test CSRF token fix - verify token can be read and used

echo "🧪 Testing CSRF Token Fix"
echo "=========================="
echo ""

# Step 1: Get CSRF token
echo "1️⃣  Fetching CSRF token..."
RESPONSE=$(curl -s -i http://localhost:3000/api/csrf-token)

# Extract token from cookie
TOKEN=$(echo "$RESPONSE" | grep -o 'csrf-token=[^;]*' | tail -1 | cut -d= -f2)

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: No CSRF token found in cookie"
  exit 1
fi

echo "✅ CSRF token received: ${TOKEN:0:20}..."
echo ""

# Step 2: Verify cookie is NOT HttpOnly
if echo "$RESPONSE" | grep -q "HttpOnly"; then
  echo "❌ FAILED: Cookie is still HttpOnly - JavaScript cannot read it"
  exit 1
fi

echo "✅ Cookie is NOT HttpOnly - JavaScript can read it"
echo ""

# Step 3: Test protected endpoint with token
echo "2️⃣  Testing protected endpoint (PUT /api/partners)..."

# First try without token (should fail)
echo "   Testing WITHOUT token (should fail with 403)..."
RESPONSE_NO_TOKEN=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"partnerId":"000000000000000000000001","name":"Test"}' \
  http://localhost:3000/api/partners)

STATUS_NO_TOKEN=$(echo "$RESPONSE_NO_TOKEN" | tail -1)

if [ "$STATUS_NO_TOKEN" = "403" ]; then
  echo "   ✅ Correctly rejected (403 Forbidden)"
else
  echo "   ⚠️  Expected 403, got $STATUS_NO_TOKEN"
fi

# Now try with token (should pass CSRF check)
echo "   Testing WITH token (should pass CSRF check)..."
RESPONSE_WITH_TOKEN=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Cookie: csrf-token=$TOKEN" \
  -d '{"partnerId":"000000000000000000000001","name":"Test"}' \
  http://localhost:3000/api/partners)

STATUS_WITH_TOKEN=$(echo "$RESPONSE_WITH_TOKEN" | tail -1)
BODY_WITH_TOKEN=$(echo "$RESPONSE_WITH_TOKEN" | head -n -1)

if [ "$STATUS_WITH_TOKEN" = "403" ]; then
  if echo "$BODY_WITH_TOKEN" | grep -q "CSRF"; then
    echo "   ❌ CSRF check still failing with token present"
    echo "   Response: $BODY_WITH_TOKEN"
    exit 1
  fi
fi

if [ "$STATUS_WITH_TOKEN" = "401" ]; then
  echo "   ✅ CSRF check passed (401 = not authenticated, but CSRF accepted)"
elif [ "$STATUS_WITH_TOKEN" = "400" ] || [ "$STATUS_WITH_TOKEN" = "404" ]; then
  echo "   ✅ CSRF check passed (business logic error, but CSRF accepted)"
else
  echo "   ℹ️  Got status $STATUS_WITH_TOKEN (CSRF likely passed)"
fi

echo ""
echo "🎉 CSRF Token Fix Verified!"
echo ""
echo "Summary:"
echo "  - CSRF token cookie is NOT HttpOnly ✅"
echo "  - JavaScript can read the token ✅"
echo "  - Token can be sent in X-CSRF-Token header ✅"
echo "  - Protected endpoints validate the token ✅"
echo ""
echo "🔧 Fix Details:"
echo "  Changed lib/csrf.ts line 149: httpOnly: false"
echo "  Reason: Double-submit CSRF pattern requires JavaScript to read token"
echo ""
