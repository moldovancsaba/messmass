import { isValidMessmassErasureSecret } from '@/lib/privacy/messmassErasureAuth';

describe('Messmass privacy erasure service auth', () => {
  it('fails closed when either credential is absent', () => {
    expect(isValidMessmassErasureSecret(null, 'configured')).toBe(false);
    expect(isValidMessmassErasureSecret('provided', undefined)).toBe(false);
    expect(isValidMessmassErasureSecret('', 'configured')).toBe(false);
  });

  it('accepts only an exact configured secret', () => {
    expect(isValidMessmassErasureSecret('shared-secret', 'shared-secret')).toBe(true);
    expect(isValidMessmassErasureSecret('shared-secret-x', 'shared-secret')).toBe(false);
  });
});
