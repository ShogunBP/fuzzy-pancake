import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyOverrides,
  exportTuning,
  getTuning,
  listTuning,
  onTuningChange,
  resetTuning,
  setTuning,
  type TuningPath,
} from './tuning';

describe('tuning', () => {
  beforeEach(() => resetTuning());

  it('todo default está dentro de [min, max] e tem descrição e unidade', () => {
    for (const e of listTuning()) {
      expect(e.min, e.path).toBeLessThanOrEqual(e.max);
      expect(e.default, e.path).toBeGreaterThanOrEqual(e.min);
      expect(e.default, e.path).toBeLessThanOrEqual(e.max);
      expect(e.desc.length, e.path).toBeGreaterThan(0);
      expect(e.unit.length, e.path).toBeGreaterThan(0);
    }
  });

  it('setTuning limita ao intervalo e reset restaura o default', () => {
    const [first] = listTuning();
    expect(setTuning(first.path, first.max + 1000)).toBe(first.max);
    expect(getTuning(first.path)).toBe(first.max);
    resetTuning(first.path);
    expect(getTuning(first.path)).toBe(first.default);
  });

  it('rejeita parâmetro desconhecido e valor não finito', () => {
    expect(() => getTuning('nao.existe' as TuningPath)).toThrow();
    expect(() => setTuning(listTuning()[0].path, Number.NaN)).toThrow();
  });

  it('applyOverrides aplica os válidos e devolve os rejeitados', () => {
    const [a] = listTuning();
    const rejected = applyOverrides({ [a.path]: a.max, 'x.y': 1, [listTuning()[1].path]: 'abc' });
    expect(getTuning(a.path)).toBe(a.max);
    expect(rejected.sort()).toEqual(['x.y', listTuning()[1].path].sort());
  });

  it('notifica mudanças e exporta o estado atual', () => {
    const [a] = listTuning();
    const seen: [string, number][] = [];
    const off = onTuningChange((p, v) => seen.push([p, v]));
    setTuning(a.path, a.max);
    off();
    setTuning(a.path, a.min);
    expect(seen).toEqual([[a.path, a.max]]);
    expect(exportTuning()[a.path]).toBe(a.min);
  });
});
