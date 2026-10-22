import { beforeEach, describe, expect, it } from 'vitest';

// Minimal browser stubs for the store.
const memory = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k)
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};

const { actions, getData, normalizeData, STORAGE_KEY } = await import('./store');

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('store', () => {
  beforeEach(() => actions.clearAll());

  it('saves logs newest first and persists them', async () => {
    actions.saveLog({ id: 'a', type: 'diaper', startTime: 1000, details: { diaperState: 'wet' } });
    actions.saveLog({ id: 'b', type: 'feeding', startTime: 2000, details: {} });
    expect(getData().logs.map(l => l.id)).toEqual(['b', 'a']);
    await flush();
    expect(JSON.parse(memory.get(STORAGE_KEY)!).logs).toHaveLength(2);
  });

  it('returns the removed log so it can be restored', () => {
    actions.saveLog({ id: 'a', type: 'diaper', startTime: 1000, details: {} });
    const removed = actions.removeLog('a');
    expect(getData().logs).toHaveLength(0);
    actions.saveLog(removed!);
    expect(getData().logs).toHaveLength(1);
  });

  it('exports a backup and merges it without duplicates', () => {
    actions.saveLog({ id: 'a', type: 'diaper', startTime: 1000, details: {} });
    actions.saveGrowth({ id: 'g1', date: 5000, weight: 4.2 });
    const backup = actions.exportBackup();
    expect(getData().lastBackupAt).toBeTypeOf('number');

    actions.clearAll();
    actions.saveLog({ id: 'z', type: 'sleep', startTime: 3000, details: {} });
    expect(actions.importBackup(backup)).toEqual({ logs: 1, growth: 1 });
    expect(actions.importBackup(backup)).toEqual({ logs: 0, growth: 0 });
    expect(getData().logs.map(l => l.id)).toEqual(['z', 'a']);
    expect(getData().onboarded).toBe(true);
  });

  it('accepts a plain array of logs and rejects invalid files', () => {
    expect(actions.importBackup(JSON.stringify([{ id: 1, type: 'feeding', startTime: 10, details: {} }, { type: 'unknown', startTime: 5 }]))).toEqual({ logs: 1, growth: 0 });
    expect(getData().logs[0].id).toBe('1');
    expect(actions.importBackup('not json')).toBeNull();
    expect(actions.importBackup('{"hello":1}')).toBeNull();
  });

  it('fills in defaults for old or partial data', () => {
    const data = normalizeData({ logs: [{ id: 'x', type: 'bath', startTime: 1, details: {} }], profile: { name: 'Mia' } });
    expect(data.profile).toMatchObject({ name: 'Mia', sex: 'girl', volumeUnit: 'ml' });
    expect(data.vaccines.length).toBeGreaterThan(10);
  });

  it('does not bring back removed preset vaccines', () => {
    const first = getData().vaccines[0].id;
    actions.removeVaccine(first);
    const reloaded = normalizeData(JSON.parse(JSON.stringify(getData())));
    expect(reloaded.vaccines.some(v => v.id === first)).toBe(false);
  });
});
