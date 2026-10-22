import { describe, expect, it } from 'vitest';
import { formatPercentile, getLms, getPercentile, getWhoSeries } from './who';

describe('WHO growth standards', () => {
  it('has boys and girls series from birth to 60 months', () => {
    for (const sex of ['boy', 'girl'] as const) {
      for (const indicator of ['weight', 'length', 'head'] as const) {
        const series = getWhoSeries(indicator, sex);
        expect(series[0].month).toBe(0);
        expect(series[series.length - 1].month).toBe(60);
      }
    }
  });

  it('puts the median at the 50th percentile', () => {
    // WHO median weight for girls at birth is 3.2322 kg, boys 3.3464 kg.
    expect(getPercentile('weight', 'girl', 0, 3.2322)).toBeCloseTo(50, 1);
    expect(getPercentile('weight', 'boy', 0, 3.3464)).toBeCloseTo(50, 1);
  });

  it('matches published percentiles', () => {
    // WHO boys weight-for-age at 12 months: 3rd percentile ≈ 7.8 kg, 97th ≈ 11.8 kg.
    expect(getPercentile('weight', 'boy', 12, 7.8)).toBeCloseTo(3, 0);
    expect(getPercentile('weight', 'boy', 12, 11.8)).toBeCloseTo(97, 0);
    // Girls length at 6 months: median 65.7 cm.
    expect(getPercentile('length', 'girl', 6, 65.7309)).toBeCloseTo(50, 0);
  });

  it('interpolates between table rows and rejects out-of-range ages', () => {
    const a = getLms('weight', 'girl', 6)!;
    const b = getLms('weight', 'girl', 7)!;
    const mid = getLms('weight', 'girl', 6.5)!;
    expect(mid.M).toBeCloseTo((a.M + b.M) / 2, 6);
    expect(getPercentile('weight', 'girl', 61, 18)).toBeNull();
  });

  it('formats extreme percentiles', () => {
    expect(formatPercentile(0.2)).toBe('<1');
    expect(formatPercentile(99.6)).toBe('>99');
    expect(formatPercentile(4.27)).toBe('4.3');
    expect(formatPercentile(48.6)).toBe('49');
  });
});
