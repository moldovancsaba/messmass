import fs from 'node:fs';
import path from 'node:path';
import { computeInnerBodyHeight } from '@/lib/chartInnerBodyHeight';
import { canonicalizeClub, suggestClubClusters } from '@/lib/brandEntityClustering';

const styleMap = new WeakMap<object, Partial<CSSStyleDeclaration>>();

function mockElement(
  dims: { offsetHeight: number; clientHeight: number },
  css: Partial<CSSStyleDeclaration>
): HTMLElement {
  const el = {
    offsetHeight: dims.offsetHeight,
    clientHeight: dims.clientHeight,
  } as unknown as HTMLElement;
  styleMap.set(el, css);
  return el;
}

beforeAll(() => {
  const getComputedStyleMock = (el: Element) => (styleMap.get(el) || {}) as CSSStyleDeclaration;
  (global as any).window = { getComputedStyle: getComputedStyleMock };
  (global as any).getComputedStyle = getComputedStyleMock;
});

describe('Report Builder runaway vertical resize guard & Club Clusters merge filter', () => {
  it('subtracts container padding, borders, and header margins so bodyHeight is a mathematical fixed point', () => {
    const container = mockElement(
      { offsetHeight: 350, clientHeight: 348 },
      {
        paddingTop: '24px',
        paddingBottom: '24px',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
      }
    );
    const titleZone = mockElement(
      { offsetHeight: 42, clientHeight: 42 },
      { marginTop: '0px', marginBottom: '0px' }
    );
    const subtitleZone = mockElement(
      { offsetHeight: 20, clientHeight: 20 },
      { marginTop: '4px', marginBottom: '0px' }
    );

    // Inner box = 348 - 48 = 300; minus title (42) and subtitle (20 + 4) = 234px
    const bodyHeight = computeInnerBodyHeight(container, titleZone, subtitleZone);
    expect(bodyHeight).toBe(234);

    // Re-rendering with bodyZone=234 produces exact same outer offsetHeight = 24+1+42+4+20+234+24+1 = 350px (zero drift!)
    const resultingOffsetHeight = 24 + 1 + 42 + 4 + 20 + bodyHeight + 24 + 1;
    expect(resultingOffsetHeight).toBe(350);
  });

  it('ensures Visualization.module.css sets --block-height and avoids padding/height:100% overrides on .unifiedChartItem', () => {
    const cssPath = path.join(process.cwd(), 'app/admin/visualization/Visualization.module.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const gridMatch = css.match(/\.chartsGridBase\s*\{([^}]*)\}/);
    expect(gridMatch).not.toBeNull();
    expect(gridMatch![1]).toContain('--block-height:');

    const unifiedMatch = css.match(/\.unifiedChartItem\s*\{([^}]*)\}/);
    expect(unifiedMatch).not.toBeNull();
    expect(unifiedMatch![1]).not.toMatch(/\bpadding\s*:/);
    expect(unifiedMatch![1]).not.toMatch(/\bheight\s*:\s*100%/);
  });

  it('removes a suggested duplicate cluster once its variants have been merged in aliasMap', () => {
    const rawItems = [
      { name: 'ftc ferencvárosi tc (green hoodie)', count: 1 },
      { name: 'ftctc', count: 1 },
    ];
    // Before merge: suggested as a duplicate cluster for Ferencvárosi TC
    const before = suggestClubClusters(rawItems, {});
    expect(before).toHaveLength(1);
    expect(before[0].suggestedTarget).toBe('Ferencvárosi TC');

    // After merging both variants into Ferencvárosi TC: cluster must disappear immediately
    const after = suggestClubClusters(rawItems, {
      'ftc ferencvárosi tc (green hoodie)': 'Ferencvárosi TC',
      ftctc: 'Ferencvárosi TC',
    });
    expect(after).toHaveLength(0);
  });

  it('never falsely merges distinct clubs via substring collisions (Diósgyőri VTK, Szeged-Csanád, Atomerőmű SE, ETO University, DVTK HUNTHERM)', () => {
    expect(canonicalizeClub('Diósgyőri VTK')?.canonicalName).toBe('DVTK Diósgyőr');
    expect(canonicalizeClub('DVTK HUNTHERM')?.canonicalName).toBe('DVTK HUNTHERM');
    expect(canonicalizeClub('Szeged-Csanád Grosics Akadémia')?.canonicalName).toBe('Szeged-Csanád Grosics Akadémia');
    expect(canonicalizeClub('Atomerőmű SE')?.canonicalName).toBe('Atomerőmű SE');
    expect(canonicalizeClub('ETO University Handball Team')?.canonicalName).toBe('ETO University Handball Team');
    expect(canonicalizeClub('dvsc handball')?.canonicalName).toBe('DVSC Schaffler');

    // Already-merged Győri Audi ETO KC and OTP Bank - PICK Szeged must NOT re-appear next to Diósgyőri VTK / Szeged-Csanád
    const clusters = suggestClubClusters(
      [
        { name: 'Győri Audi ETO KC', count: 8 },
        { name: 'Diósgyőri VTK', count: 3 },
        { name: 'OTP Bank - PICK Szeged', count: 5 },
        { name: 'Szeged-Csanád Grosics Akadémia', count: 2 },
        { name: 'Paksi FC', count: 10 },
        { name: 'Atomerőmű SE', count: 8 },
        { name: 'ETO University Handball Team', count: 1 },
        { name: 'UNI Győr', count: 1 },
      ],
      {},
      {
        'győri audi eto kc': 'Győri Audi ETO KC',
        'diósgyőri vtk': 'Diósgyőri VTK',
        'otp bank - pick szeged': 'OTP Bank - PICK Szeged',
        'szeged-csanád grosics akadémia': 'Szeged-Csanád Grosics Akadémia',
        'paksi fc': 'Paksi FC',
        'atomerőmű se': 'Atomerőmű SE',
        'eto university handball team': 'ETO University Handball Team',
        'uni győr': 'UNI Győr',
      }
    );
    expect(clusters).toHaveLength(0);
  });
});
