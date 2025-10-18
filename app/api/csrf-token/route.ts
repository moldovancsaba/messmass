// app/api/csrf-token/route.ts
// WHAT: API endpoint to get CSRF token for client-side AJAX requests
// WHY: Clients need token to include in state-changing request headers
// HOW: Generate token, set cookie, return token in response body

import { getCsrfTokenEndpoint } from '@/lib/csrf';

// WHAT: GET handler for CSRF token
// WHY: Allows clients to fetch token before making POST/PUT/DELETE requests
// HOW: Uses helper function from csrf.ts that handles cookie and response
export async function GET() {
  return getCsrfTokenEndpoint();
}
