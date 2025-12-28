#!/bin/bash
# Test the Google Sheets pull endpoint

# You need to:
# 1. Start the dev server: npm run dev (in another terminal)
# 2. Get the partner ID from MongoDB for Szerencsejáték Zrt.
# 3. Run this script with the partner ID

if [ -z "$1" ]; then
  echo "Usage: ./scripts/test-pull-api.sh <PARTNER_ID>"
  echo ""
  echo "Steps:"
  echo "1. npm run dev (start server in another terminal)"
  echo "2. Find partner ID:"
  echo "   mongosh (connect to your MongoDB)"
  echo "   use messmass"
  echo "   db.partners.findOne({ name: /Szerencsejáték/ }, { _id: 1 })"
  echo "3. Copy the _id value and run this script"
  exit 1
fi

PARTNER_ID=$1

echo "🧪 Testing Google Sheets Pull Endpoint"
echo "======================================"
echo ""
echo "Partner ID: $PARTNER_ID"
echo ""
echo "📤 Sending POST request to pull events..."
echo ""

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}' \
  "http://localhost:3001/api/partners/$PARTNER_ID/google-sheet/pull" | jq .

echo ""
echo "✅ Test complete"
