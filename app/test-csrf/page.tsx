'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

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
    <div className={styles.container}>
      <h1>CSRF Token Diagnostic</h1>
      
      <div className={styles.section}>
        <h2>Test 1: Cookie Readable by JavaScript?</h2>
        <p><strong>document.cookie value:</strong></p>
        <pre className={styles.codeBlock}>
          {cookieValue || 'Loading...'}
        </pre>
        {cookieValue.includes('csrf-token') ? (
          <p className={styles.successText}>✅ Token IS readable by JavaScript</p>
        ) : (
          <p className={styles.errorText}>❌ Token NOT readable (might be HttpOnly)</p>
        )}
      </div>

      <div className={styles.section}>
        <h2>Test 2: API Token Endpoint</h2>
        <p><strong>/api/csrf-token response:</strong></p>
        <pre className={styles.codeBlock}>
          {apiToken || 'Loading...'}
        </pre>
      </div>

      <div className={styles.section}>
        <h2>Test 3: Protected Endpoint (PUT /api/partners)</h2>
        <button 
          onClick={testCSRF}
          className={styles.testButton}
        >
          Test CSRF Protection
        </button>
        <p><strong>Result:</strong></p>
        <pre className={styles.resultBlock}>
          {testResult || 'Click button to test'}
        </pre>
        {testResult.includes('401') && (
          <p className={styles.successText}>✅ CSRF passed (401 = not authenticated, but CSRF OK)</p>
        )}
        {testResult.includes('403') && testResult.includes('CSRF') && (
          <p className={styles.errorText}>❌ CSRF failed</p>
        )}
      </div>

      <div className={styles.sectionYellow}>
        <h2>Instructions</h2>
        <ol>
          <li>Test 1 should show the csrf-token cookie value</li>
          <li>Test 2 should show the token from API</li>
          <li>Click &quot;Test CSRF Protection&quot; button</li>
          <li>Expected: Status 401 (CSRF passed, auth failed)</li>
          <li>If Status 403 with &quot;CSRF&quot;: Token not working</li>
        </ol>
      </div>
    </div>
  );
}
