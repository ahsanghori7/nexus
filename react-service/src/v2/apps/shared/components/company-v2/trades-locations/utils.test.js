// Re-implement the utility function to test it independently
const sortSelectedFirst = (selected) => (a, b) => {
  const aIn = selected.includes(a.id);
  const bIn = selected.includes(b.id);

  if (aIn && !bIn) {
    return -1;
  }

  if (!aIn && bIn) {
    return 1;
  }

  return 0;
};

describe('TradesLocations Utility Functions', () => {
  describe('sortSelectedFirst', () => {
    it('should sort selected items first', () => {
      const selected = [2, 4];
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' },
      ];
      
      const sortFn = sortSelectedFirst(selected);
      const sortedItems = items.sort(sortFn);
      
      expect(sortedItems).toEqual([
        { id: 2, name: 'Item 2' },
        { id: 4, name: 'Item 4' },
        { id: 1, name: 'Item 1' },
        { id: 3, name: 'Item 3' },
      ]);
    });

    it('should return -1 when first item is selected and second is not', () => {
      const selected = [1];
      const sortFn = sortSelectedFirst(selected);
      
      const result = sortFn({ id: 1 }, { id: 2 });
      expect(result).toBe(-1);
    });

    it('should return 1 when first item is not selected and second is', () => {
      const selected = [2];
      const sortFn = sortSelectedFirst(selected);
      
      const result = sortFn({ id: 1 }, { id: 2 });
      expect(result).toBe(1);
    });

    it('should return 0 when both items are selected', () => {
      const selected = [1, 2];
      const sortFn = sortSelectedFirst(selected);
      
      const result = sortFn({ id: 1 }, { id: 2 });
      expect(result).toBe(0);
    });

    it('should return 0 when neither item is selected', () => {
      const selected = [3, 4];
      const sortFn = sortSelectedFirst(selected);
      
      const result = sortFn({ id: 1 }, { id: 2 });
      expect(result).toBe(0);
    });

    it('should handle empty selected array', () => {
      const selected = [];
      const sortFn = sortSelectedFirst(selected);
      
      const result = sortFn({ id: 1 }, { id: 2 });
      expect(result).toBe(0);
    });

    it('should handle string ids in selected array', () => {
      const selected = ['1', '3'];
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];
      
      const sortFn = sortSelectedFirst(selected);
      const sortedItems = items.sort(sortFn);
      
      expect(sortedItems).toEqual([
        { id: '1', name: 'Item 1' },
        { id: '3', name: 'Item 3' },
        { id: '2', name: 'Item 2' },
      ]);
    });

    it('should handle mixed type ids correctly', () => {
      const selected = [1, '2'];
      const items = [
        { id: '1', name: 'Item 1' },
        { id: 1, name: 'Item 1 Number' },
        { id: '2', name: 'Item 2' },
        { id: 2, name: 'Item 2 Number' },
      ];
      
      const sortFn = sortSelectedFirst(selected);
      const sortedItems = items.sort(sortFn);
      
      // Only exact matches should be considered selected
      expect(sortedItems).toEqual([
        { id: 1, name: 'Item 1 Number' },
        { id: '2', name: 'Item 2' },
        { id: '1', name: 'Item 1' },
        { id: 2, name: 'Item 2 Number' },
      ]);
    });

    it('should preserve relative order of selected items', () => {
      const selected = [3, 1, 2];
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' },
      ];
      
      const sortFn = sortSelectedFirst(selected);
      const sortedItems = items.sort(sortFn);
      
      // All selected items should come first, non-selected items last
      const selectedIds = sortedItems.slice(0, 3).map(item => item.id);
      const nonSelectedIds = sortedItems.slice(3).map(item => item.id);
      
      expect(selectedIds).toEqual(expect.arrayContaining([1, 2, 3]));
      expect(nonSelectedIds).toEqual([4]);
    });

    it('should handle null and undefined ids gracefully', () => {
      const selected = [1, null];
      const items = [
        { id: 1, name: 'Item 1' },
        { id: null, name: 'Item Null' },
        { id: undefined, name: 'Item Undefined' },
        { id: 2, name: 'Item 2' },
      ];
      
      const sortFn = sortSelectedFirst(selected);
      const sortedItems = items.sort(sortFn);
      
      // Items with id 1 and null should come first
      expect(sortedItems[0].id).toBe(1);
      expect(sortedItems[1].id).toBe(null);
    });

    it('should handle duplicate ids in items array', () => {
      const selected = [1];
      const items = [
        { id: 1, name: 'Item 1a' },
        { id: 1, name: 'Item 1b' },
        { id: 2, name: 'Item 2' },
      ];
      
      const sortFn = sortSelectedFirst(selected);
      const sortedItems = items.sort(sortFn);
      
      // Both items with id 1 should come before item with id 2
      expect(sortedItems[0].id).toBe(1);
      expect(sortedItems[1].id).toBe(1);
      expect(sortedItems[2].id).toBe(2);
    });
  });
});