import { normalizeSections } from 'v2/apps/clink/pages/pmp/project-details/helpers';

describe('normalizeSections', () => {
  it('returns the same array when input is already an array', () => {
    const sections = [{ id: 1 }];
    expect(normalizeSections(sections)).toBe(sections);
  });

  it('parses a JSON string representing an array', () => {
    const result = normalizeSections('[{"id":1},{"id":2}]');
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns empty array for empty or invalid strings', () => {
    expect(normalizeSections('   ')).toEqual([]);
    expect(normalizeSections('not-a-json')).toEqual([]);
  });

  it('returns values array when input is an object', () => {
    const result = normalizeSections({ first: { id: 1 }, second: { id: 2 } });
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns empty array for nullish or unsupported inputs', () => {
    expect(normalizeSections(null)).toEqual([]);
    expect(normalizeSections(42)).toEqual([]);
  });
});
