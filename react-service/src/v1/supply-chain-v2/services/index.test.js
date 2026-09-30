import SupplyChainV2Service, { dedupeAttributeOptions } from './index';

describe('SupplyChainV2Service', () => {
  describe('filterRepeatValues', () => {
    test('removes duplicate entries by id', () => {
      const service = new SupplyChainV2Service();
      const data = [
        { id: 1, label: 'Above Ground Drainage' },
        { id: 2, label: 'Brick / Facade Cleaning' },
        { id: 2, label: 'Brick / Facade Cleaning' },
        { id: 3, label: '3D Modelling' },
      ];

      expect(service.filterRepeatValues(data)).toEqual([
        { id: 1, label: 'Above Ground Drainage' },
        { id: 2, label: 'Brick / Facade Cleaning' },
        { id: 3, label: '3D Modelling' },
      ]);
    });

    test('returns empty array when data is falsy', () => {
      const service = new SupplyChainV2Service();

      expect(service.filterRepeatValues(null)).toEqual([]);
      expect(service.filterRepeatValues(undefined)).toEqual([]);
    });
  });

  describe('dedupeAttributeOptions', () => {
    test('delegates to filterRepeatValues', () => {
      const data = [
        { id: 1, label: 'Above Ground Drainage' },
        { id: 1, label: 'Above Ground Drainage' },
      ];

      expect(dedupeAttributeOptions(data)).toEqual([
        { id: 1, label: 'Above Ground Drainage' },
      ]);
    });
  });
});
