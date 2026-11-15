// tests/merchandise-adoption-ratio.test.ts
// WHAT: Verify mathematical distinction between merchandise ratio (sum = 100%) and individual fan adoption %
// WHY: Prevent confusing the share of merchandise items with the percentage of visible attendees wearing an item

describe('Merchandise Metrics: Ratio vs. Trustworthy Fan Adoption', () => {
  const totalPeople = 26825;
  const items = [
    { item: 'Jersey', count: 12876 },
    { item: 'Logo', count: 4292 },
    { item: 'Banner', count: 2683 },
    { item: 'Scarf', count: 1341 },
    { item: 'Flag', count: 537 },
    { item: 'Cap / Hat', count: 268 },
  ];

  const totalMerchCount = items.reduce((acc, i) => acc + i.count, 0); // 21,997

  it('calculates merchandise ratio summing to 100% for the pie chart', () => {
    expect(totalMerchCount).toBe(21997);

    const ratios = items.map((i) => Math.round((i.count / totalMerchCount) * 1000) / 10);
    const sum = ratios.reduce((a, b) => a + b, 0);

    // Sum of rounded percentages must be ~100%
    expect(sum).toBeGreaterThanOrEqual(99.8);
    expect(sum).toBeLessThanOrEqual(100.2);

    // Jersey share of merch mix should be ~58.5%
    expect(ratios[0]).toBe(58.5);
  });

  it('calculates true individual fan adoption against total visible persons for the bar chart', () => {
    const adoptionRates = items.map((i) => Math.round((i.count / totalPeople) * 1000) / 10);

    // Jersey adoption among all visible fans is ~48.0%, NOT 58.5%
    expect(adoptionRates[0]).toBe(48.0);
    // Logo adoption is ~16.0%
    expect(adoptionRates[1]).toBe(16.0);
    // Banner is ~10.0%
    expect(adoptionRates[2]).toBe(10.0);
    // Scarf is ~5.0%
    expect(adoptionRates[3]).toBe(5.0);
    // Flag is ~2.0%
    expect(adoptionRates[4]).toBe(2.0);
    // Cap is ~1.0%
    expect(adoptionRates[5]).toBe(1.0);

    // Verify adoption rate is strictly lower than 100% and reflects individual row calculation
    adoptionRates.forEach((rate) => {
      expect(rate).toBeLessThanOrEqual(100);
      expect(rate).toBeGreaterThan(0);
    });
  });

  it('prevents false equivalence between item share and fan adoption', () => {
    const jerseySharePct = (12876 / totalMerchCount) * 100;
    const jerseyFanAdoptionPct = (12876 / totalPeople) * 100;

    expect(jerseySharePct).not.toBe(jerseyFanAdoptionPct);
    expect(jerseyFanAdoptionPct).toBeLessThan(jerseySharePct);
  });
});
