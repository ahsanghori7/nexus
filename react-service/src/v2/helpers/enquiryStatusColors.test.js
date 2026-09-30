import getStatusColor from 'v2/helpers/enquiryStatusColors';

// Mock clink-components since it's already mocked in jest.config.js
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        japaneseIndigo: '#293f7b',
        blueMagentaViolet: '#6f3d99'
      },
      prosper: {
        prosperBlackStatus: '#000000',
        prosperBoxRed: '#dc3545',
        prosperBoxRedStatus: '#dc3545',
        iguanaGreen: '#6fb067'
      }
    }
  }
}));

describe('enquiryStatusColors.js', () => {
  describe('getStatusColor function', () => {
    describe('badge mode (default)', () => {
      test('should return "danger" for status 1', () => {
        expect(getStatusColor(1)).toBe('danger');
      });

      test('should return "danger" for status 5', () => {
        expect(getStatusColor(5)).toBe('danger');
      });

      test('should return "danger" for status 6', () => {
        expect(getStatusColor(6)).toBe('danger');
      });

      test('should return "pink" for status 4', () => {
        expect(getStatusColor(4)).toBe('pink');
      });

      test('should return "black" for status 2', () => {
        expect(getStatusColor(2)).toBe('black');
      });

      test('should return "prosper-black" for status 3', () => {
        expect(getStatusColor(3)).toBe('prosper-black');
      });

      test('should return "prosper-purple" for status 9', () => {
        expect(getStatusColor(9)).toBe('prosper-purple');
      });

      test('should return "prosper-green" for status 7', () => {
        expect(getStatusColor(7)).toBe('prosper-green');
      });

      test('should return empty string for unknown status', () => {
        expect(getStatusColor(999)).toBe('');
        expect(getStatusColor(0)).toBe('');
        expect(getStatusColor(-1)).toBe('');
      });
    });

    describe('color mode (badge = false)', () => {
      test('should return prosperBoxRedStatus color for status 1', () => {
        expect(getStatusColor(1, false)).toBe('#dc3545');
      });

      test('should return prosperBoxRedStatus color for status 5', () => {
        expect(getStatusColor(5, false)).toBe('#dc3545');
      });

      test('should return prosperBoxRedStatus color for status 6', () => {
        expect(getStatusColor(6, false)).toBe('#dc3545');
      });

      test('should return prosperBoxRed color for status 4', () => {
        expect(getStatusColor(4, false)).toBe('#dc3545');
      });

      test('should return japaneseIndigo color for status 2', () => {
        expect(getStatusColor(2, false)).toBe('#293f7b');
      });

      test('should return prosperBlackStatus color for status 3', () => {
        expect(getStatusColor(3, false)).toBe('#000000');
      });

      test('should return blueMagentaViolet color for status 9', () => {
        expect(getStatusColor(9, false)).toBe('#6f3d99');
      });

      test('should return iguanaGreen color for status 7', () => {
        expect(getStatusColor(7, false)).toBe('#6fb067');
      });

      test('should return empty string for unknown status in color mode', () => {
        expect(getStatusColor(999, false)).toBe('');
        expect(getStatusColor(0, false)).toBe('');
        expect(getStatusColor(-1, false)).toBe('');
      });
    });

    describe('input type handling', () => {
      test('should handle string numbers correctly', () => {
        expect(getStatusColor('1')).toBe('danger');
        expect(getStatusColor('2')).toBe('black');
        expect(getStatusColor('3')).toBe('prosper-black');
      });

      test('should handle string numbers in color mode', () => {
        expect(getStatusColor('1', false)).toBe('#dc3545');
        expect(getStatusColor('2', false)).toBe('#293f7b');
      });

      test('should handle undefined and null gracefully', () => {
        expect(getStatusColor(undefined)).toBe('');
        expect(getStatusColor(null)).toBe('');
      });
    });
  });
});