import { getFranchiseInfo } from '@/lib/brandEntityClustering';

describe('Canonical Club & Franchise Merging (INV-001, INV-003)', () => {
  it('correctly maps Debreceni VSC and DVSC to canonical Debreceni VSC', () => {
    const dvsc = getFranchiseInfo('dvsc');
    const debrecen = getFranchiseInfo('debreceni vsc');
    const loki = getFranchiseInfo('loki');

    expect(dvsc?.name).toBe('Debreceni VSC');
    expect(debrecen?.name).toBe('Debreceni VSC');
    expect(loki?.name).toBe('Debreceni VSC');
  });

  it('correctly maps Haladás and FC Szerencsési Haladás to canonical Szombathelyi Haladás', () => {
    const haladas = getFranchiseInfo('haladás');
    const szerencsesi = getFranchiseInfo('fc szerencsési haladás');
    const szombathely = getFranchiseInfo('szombathely');

    expect(haladas?.name).toBe('Szombathelyi Haladás');
    expect(szerencsesi?.name).toBe('Szombathelyi Haladás');
    expect(szombathely?.name).toBe('Szombathelyi Haladás');
  });

  it('correctly maps Nyíregyháza and Szpari to canonical Nyíregyháza FC', () => {
    const nyiregyhaza = getFranchiseInfo('nyíregyháza');
    const szpari = getFranchiseInfo('szpari');

    expect(nyiregyhaza?.name).toBe('Nyíregyháza FC');
    expect(szpari?.name).toBe('Nyíregyháza FC');
  });

  it('correctly remaps computer vision venue false-positives to domestic Hungarian franchises', () => {
    const hibernian = getFranchiseInfo('hibernian fc');
    const celtic = getFranchiseInfo('celtic fc');
    const hajduk = getFranchiseInfo('hnk hajduk split');
    const barca = getFranchiseInfo('fc barcelona');

    expect(hibernian?.name).toBe('Ferencvárosi TC');
    expect(celtic?.name).toBe('Ferencvárosi TC');
    expect(hajduk?.name).toBe('Hydro Fehérvár AV19');
    expect(barca?.name).toBe('Videoton FC Fehérvár');
  });
});
