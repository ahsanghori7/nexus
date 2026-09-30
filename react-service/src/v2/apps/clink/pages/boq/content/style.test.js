import { marginRight, inputBaseSx, modalSx } from './style';

// Mock CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        boqAccent: '#14A38B',
        boqAccentHover: '#128A75',
        clinkLightPurple: '#E8E2F5',
        darkCharcoal: '#2C2C2C',
        clinkGreen: '#00C851',
        clinkGreenDark: '#4aac9c',
        clinkPurple: '#6F42C1',
        clinkRed: '#E02020',
        white: '#FFFFFF',
      },
      prosper: {
        dimGray2: '#696969',
      },
    },
  },
}));

describe('BOQ Content Style Objects', () => {
  describe('marginRight', () => {
    it('exports marginRight with correct structure', () => {
      expect(marginRight).toEqual({
        mr: 1,
      });
    });
  });

  describe('inputBaseSx', () => {
    const mockPalette = {
      secondaryBlack: {
        main: '#333333',
      },
    };

    it('returns correct styles when noteReadOnly is false', () => {
      const result = inputBaseSx(mockPalette, false);
      
      expect(result).toEqual(
        expect.objectContaining({
          width: '100%',
          padding: '10px 12px',
          boxSizing: 'border-box',
          color: '#2C2C2C',
          border: '1px solid #E8E2F5',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflowY: 'auto',
        })
      );
    });

    it('returns correct styles when noteReadOnly is true with palette', () => {
      const result = inputBaseSx(mockPalette, true);
      
      expect(result).toEqual(
        expect.objectContaining({
          width: '100%',
          padding: '10px 12px',
          boxSizing: 'border-box',
          color: '#333333',
          border: '1px solid #E8E2F5',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflowY: 'auto',
        })
      );
    });

    it('returns correct styles when noteReadOnly is true without palette', () => {
      const result = inputBaseSx(null, true);
      
      expect(result).toEqual(
        expect.objectContaining({
          width: '100%',
          padding: '10px 12px',
          boxSizing: 'border-box',
          color: '#2C2C2C',
          border: '1px solid #E8E2F5',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflowY: 'auto',
        })
      );
    });

    it('includes webkit scrollbar styles', () => {
      const result = inputBaseSx(mockPalette, false);
      
      expect(result).toEqual(
        expect.objectContaining({
          '&::WebkitScrollbar': { width: '10px' },
          '&::WebkitScrollbarTrack': {
            boxShadow: 'inset 0 0 5px #6F42C1',
            borderRadius: '10px',
          },
          '&::WebkitScrollbarThumb': {
            background: '#14A38B',
            borderRadius: '10px',
          },
          '&::WebkitScrollbarThumb:hover': {
            background: '#128A75',
          },
        })
      );
    });
  });

  describe('modalSx', () => {
    it('exports modalSx with correct structure (confirm v2 card, no absolute buttons)', () => {
      expect(modalSx).toEqual(
        expect.objectContaining({
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          overflow: 'hidden',
        })
      );
    });
  });
});