import { jsonEqual } from './json';

describe('jsonEqual', () => {
  it('should compare nested values structurally', () => {
    expect(jsonEqual({ a: [1, { b: null }] }, { a: [1, { b: null }] })).toBe(true);
    expect(jsonEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(jsonEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(jsonEqual([], {})).toBe(false);
  });

  it('should treat undefined keys as absent', () => {
    expect(jsonEqual({ l: 0.5, h: undefined }, { l: 0.5 })).toBe(true);
  });
});
