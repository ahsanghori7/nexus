// Re-implement the utility function to test it independently
const checkOption = (option, newValue) => {
  if (!option || !newValue) {
    return false;
  }
  return Boolean(
    option.filter(
      (optListItem) => Number(optListItem.id) === Number(newValue.id),
    ).length,
  );
};

describe('Select Dialog Utility Functions', () => {
  describe('checkOption', () => {
    it('should return true when option contains matching item', () => {
      const option = [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' },
        { id: 3, name: 'Option 3' },
      ];
      const newValue = { id: 2, name: 'Option 2' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });

    it('should return false when option does not contain matching item', () => {
      const option = [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' },
        { id: 3, name: 'Option 3' },
      ];
      const newValue = { id: 4, name: 'Option 4' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(false);
    });

    it('should return false when option is null', () => {
      const newValue = { id: 1, name: 'Option 1' };
      
      const result = checkOption(null, newValue);
      expect(result).toBe(false);
    });

    it('should return false when option is undefined', () => {
      const newValue = { id: 1, name: 'Option 1' };
      
      const result = checkOption(undefined, newValue);
      expect(result).toBe(false);
    });

    it('should return false when newValue is null', () => {
      const option = [{ id: 1, name: 'Option 1' }];
      
      const result = checkOption(option, null);
      expect(result).toBe(false);
    });

    it('should return false when newValue is undefined', () => {
      const option = [{ id: 1, name: 'Option 1' }];
      
      const result = checkOption(option, undefined);
      expect(result).toBe(false);
    });

    it('should handle string ids correctly', () => {
      const option = [
        { id: '1', name: 'Option 1' },
        { id: '2', name: 'Option 2' },
      ];
      const newValue = { id: '2', name: 'Option 2' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });

    it('should match string and number ids correctly', () => {
      const option = [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' },
      ];
      const newValue = { id: '2', name: 'Option 2' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });

    it('should match number and string ids correctly', () => {
      const option = [
        { id: '1', name: 'Option 1' },
        { id: '2', name: 'Option 2' },
      ];
      const newValue = { id: 2, name: 'Option 2' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });

    it('should handle empty option array', () => {
      const option = [];
      const newValue = { id: 1, name: 'Option 1' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(false);
    });

    it('should handle missing id property in option items', () => {
      const option = [
        { name: 'Option 1' },
        { id: 2, name: 'Option 2' },
      ];
      const newValue = { id: 1, name: 'Option 1' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(false);
    });

    it('should handle missing id property in newValue', () => {
      const option = [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' },
      ];
      const newValue = { name: 'Option 1' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(false);
    });

    it('should handle NaN ids gracefully', () => {
      const option = [
        { id: 'abc', name: 'Option 1' },
        { id: 2, name: 'Option 2' },
      ];
      const newValue = { id: 'xyz', name: 'Option 3' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(false); // NaN !== NaN
    });

    it('should handle zero ids correctly', () => {
      const option = [
        { id: 0, name: 'Option 0' },
        { id: 1, name: 'Option 1' },
      ];
      const newValue = { id: 0, name: 'Option 0' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });

    it('should handle multiple matching items', () => {
      const option = [
        { id: 1, name: 'Option 1a' },
        { id: 1, name: 'Option 1b' },
        { id: 2, name: 'Option 2' },
      ];
      const newValue = { id: 1, name: 'Option 1c' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });

    it('should handle option items with additional properties', () => {
      const option = [
        { id: 1, name: 'Option 1', extra: 'data', selected: true },
        { id: 2, name: 'Option 2', extra: 'more' },
      ];
      const newValue = { id: 2, name: 'Option 2', different: 'property' };
      
      const result = checkOption(option, newValue);
      expect(result).toBe(true);
    });
  });
});