// tests/clipboard.test.ts
// WHAT: copyTextToClipboard resolves true only when the Clipboard API took the text,
//     never throws, and the deprecated document.execCommand('copy') is gone from
//     first-party source.
// WHY: SharePopup and PasswordModal fell back to document.execCommand('copy')
//     (messmass#465). The suite runs under jest-environment-node, which has no DOM,
//     so the helper is exercised against a stubbed navigator and the "no execCommand"
//     rule is enforced by scanning source, the same way
//     tests/no-dynamic-code-evaluation.test.ts guards eval.

import fs from 'fs';
import path from 'path';
import { copyTextToClipboard } from '@/lib/clipboard';

const realNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function stubNavigator(value: unknown) {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}

afterEach(() => {
  if (realNavigator) Object.defineProperty(globalThis, 'navigator', realNavigator);
  else delete (globalThis as { navigator?: unknown }).navigator;
});

describe('copyTextToClipboard', () => {
  it('writes the text through navigator.clipboard and resolves true', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    stubNavigator({ clipboard: { writeText } });

    await expect(copyTextToClipboard('https://example.test/report/abc')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('https://example.test/report/abc');
  });

  it('resolves false, without throwing, when the browser refuses the write', async () => {
    const writeText = jest.fn().mockRejectedValue(new DOMException('Document is not focused', 'NotAllowedError'));
    stubNavigator({ clipboard: { writeText } });

    await expect(copyTextToClipboard('secret')).resolves.toBe(false);
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('resolves false on an insecure page, where navigator.clipboard is undefined', async () => {
    stubNavigator({});

    await expect(copyTextToClipboard('secret')).resolves.toBe(false);
  });

  it('resolves false when writeText is not a function', async () => {
    stubNavigator({ clipboard: {} });

    await expect(copyTextToClipboard('secret')).resolves.toBe(false);
  });

  it('resolves false when there is no navigator at all (server render)', async () => {
    stubNavigator(undefined);

    await expect(copyTextToClipboard('secret')).resolves.toBe(false);
  });

  it('copies the empty string as a real write', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    stubNavigator({ clipboard: { writeText } });

    await expect(copyTextToClipboard('')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('');
  });
});

describe('no document.execCommand in first-party source', () => {
  const ROOT = process.cwd();
  const SCAN = ['app', 'components', 'lib', 'hooks', 'contexts'];
  const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build', 'vendor']);
  const EXEC_COMMAND = /\bexecCommand\s*\(/;

  function* walk(dir: string): Generator<string> {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(full);
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) yield full;
    }
  }

  it('finds no execCommand call in app, components, lib, hooks or contexts', () => {
    const offenders: string[] = [];
    for (const dir of SCAN) {
      for (const file of walk(path.join(ROOT, dir))) {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (EXEC_COMMAND.test(line)) offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
        });
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps both copy dialogs on the shared helper', () => {
    for (const rel of ['components/SharePopup.tsx', 'components/PasswordModal.tsx']) {
      const source = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(source).toContain("from '@/lib/clipboard'");
      expect(source).toContain('copyTextToClipboard(');
    }
  });
});
