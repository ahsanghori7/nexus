import { UK, AUS, NZ, ANZ_CODE_REGIONS } from 'v2/helpers/region';

describe('region.js', () => {
  describe('exported constants', () => {
    test('should export UK constant with correct properties', () => {
      expect(UK).toEqual({
        id: 1,
        name: 'United Kingdom',
        code: 'UK'
      });
    });

    test('should export AUS constant with correct properties', () => {
      expect(AUS).toEqual({
        id: 4,
        name: 'Australia',
        code: 'AUS'
      });
    });

    test('should export NZ constant with correct properties', () => {
      expect(NZ).toEqual({
        id: 2,
        name: 'New Zealand',
        code: 'NZ'
      });
    });

    test('should export ANZ_CODE_REGIONS array with correct codes', () => {
      expect(ANZ_CODE_REGIONS).toEqual(['NZ', 'AUS']);
    });

    test('ANZ_CODE_REGIONS should contain NZ and AUS codes', () => {
      expect(ANZ_CODE_REGIONS).toContain('NZ');
      expect(ANZ_CODE_REGIONS).toContain('AUS');
      expect(ANZ_CODE_REGIONS).toHaveLength(2);
    });
  });

  describe('region object structure', () => {
    test('each region should have id, name, and code properties', () => {
      const regions = [UK, AUS, NZ];
      
      regions.forEach(region => {
        expect(region).toHaveProperty('id');
        expect(region).toHaveProperty('name');
        expect(region).toHaveProperty('code');
        expect(typeof region.id).toBe('number');
        expect(typeof region.name).toBe('string');
        expect(typeof region.code).toBe('string');
      });
    });

    test('region ids should be unique', () => {
      const ids = [UK.id, AUS.id, NZ.id];
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });

    test('region codes should be unique', () => {
      const codes = [UK.code, AUS.code, NZ.code];
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes).toHaveLength(codes.length);
    });
  });
});