describe('sanitizeHTML feature flag', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns input unchanged when ENABLE_HTML_SANITIZATION is false', async () => {
    process.env.ENABLE_HTML_SANITIZATION = 'false';
    const { sanitizeHTML } = await import('../lib/sanitize');

    const dirty = '<p>Safe</p><script>alert(1)</script>';
    expect(sanitizeHTML(dirty)).toBe(dirty);
  });

  test('removes scripts and event handlers when ENABLE_HTML_SANITIZATION is true (server fallback)', async () => {
    process.env.ENABLE_HTML_SANITIZATION = 'true';
    const { sanitizeHTML } = await import('../lib/sanitize');

    const dirty = '<p onclick="alert(1)">Safe</p><script>alert(1)</script><img src=x onerror=alert(2) />';
    const sanitized = sanitizeHTML(dirty);

    expect(sanitized).toContain('<p');
    expect(sanitized).toContain('Safe');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toMatch(/on\w+=/i);
  });
});

