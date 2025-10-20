'use client';

import { useEffect, useState } from 'react';

export default function TestCSRFPage() {
  const [cookieValue, setCookieValue] = useState<string>('');
  const [apiToken, setApiToken] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Test 1: Can we read the cookie from document.cookie?
    const cookies = document.cookie;
    const csrfCookie = cookies.split(';').find(c => c.trim().startsWith('csrf-token='));
    setCookieValue(csrfCookie || 'NOT FOUND');

    // Test 2: Fetch token from API
    fetch('/api/csrf-token')
      .then(r => r.json())
      .then(data => setApiToken(data.csrfToken || 'NONE'))
      .catch(e => setApiToken(`ERROR: ${e.message}`));
  }, []);

  async function testCSRF() {
    setTestResult('Testing...');
    
    // Get token from cookie
    const cookies = document.cookie;
    const csrfCookie = cookies.split(';').find(c => c.trim().startsWith('csrf-token='));
    const token = csrfCookie ? csrfCookie.split('=')[1] : '';

    try {
      const response = await fetch('/api/partners', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({
          partnerId: '000000000000000000000001',
          name: 'Test'
        })
      });

      const data = await response.json();
      setTestResult(`Status: ${response.status} - ${JSON.stringify(data)}`);
    } catch (e: any) {
      setTestResult(`ERROR: ${e.message}`);
    }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>CSRF Token Diagnostic</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0' }}>
        <h2>Test 1: Cookie Readable by JavaScript?</h2>
        <p><strong>document.cookie value:</strong></p>
        <pre style={{ background: 'white', padding: '10px', overflow: 'auto' }}>
          {cookieValue || 'Loading...'}
        </pre>
        {cookieValue.includes('csrf-token') ? (
          <p style={{ color: 'green' }}>✅ Token IS readable by JavaScript</p>
        ) : (
          <p style={{ color: 'red' }}>❌ Token NOT readable (might be HttpOnly)</p>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0' }}>
        <h2>Test 2: API Token Endpoint</h2>
        <p><strong>/api/csrf-token response:</strong></p>
        <pre style={{ background: 'white', padding: '10px', overflow: 'auto' }}>
          {apiToken || 'Loading...'}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0' }}>
        <h2>Test 3: Protected Endpoint (PUT /api/partners)</h2>
        <button 
          onClick={testCSRF}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Test CSRF Protection
        </button>
        <p><strong>Result:</strong></p>
        <pre style={{ background: 'white', padding: '10px', overflow: 'auto', marginTop: '10px' }}>
          {testResult || 'Click button to test'}
        </pre>
        {testResult.includes('401') && (
          <p style={{ color: 'green' }}>✅ CSRF passed (401 = not authenticated, but CSRF OK)</p>
        )}
        {testResult.includes('403') && testResult.includes('CSRF') && (
          <p style={{ color: 'red' }}>❌ CSRF failed</p>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#ffffcc' }}>
        <h2>Instructions</h2>
        <ol>
          <li>Test 1 should show the csrf-token cookie value</li>
          <li>Test 2 should show the token from API</li>
          <li>Click "Test CSRF Protection" button</li>
          <li>Expected: Status 401 (CSRF passed, auth failed)</li>
          <li>If Status 403 with "CSRF": Token not working</li>
        </ol>
      </div>
    </div>
  );
}
