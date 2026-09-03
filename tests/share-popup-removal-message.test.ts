import { deriveRemovalInfoMessage } from '@/lib/pagePasswordRemovalMessage';

describe('deriveRemovalInfoMessage', () => {
  it('reports removal when the DELETE actually changed something', () => {
    expect(deriveRemovalInfoMessage(true)).toBe('Protection removed.');
  });

  it('reports already-off when the DELETE matched nothing', () => {
    expect(deriveRemovalInfoMessage(false)).toBe('Protection was already off for this page.');
  });

  it('treats an absent removed field as already-off, not removed', () => {
    expect(deriveRemovalInfoMessage(undefined)).toBe('Protection was already off for this page.');
  });
});
