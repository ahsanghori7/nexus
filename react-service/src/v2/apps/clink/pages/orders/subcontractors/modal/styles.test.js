import { style, cancelStyle, acceptStyle, textStyles } from './styles';

// Mock the clink-components module
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
        japaneseIndigo: '#1f2937',
        clinkRed: '#dc2626',
        clinkGray: '#6b7280',
        tealShade: '#14b8a6',
      },
      prosper: {
        dimGray2: '#9ca3af',
      },
    },
  },
}));

describe('Modal Styles', () => {
  describe('style', () => {
    it('should export a valid style object', () => {
      expect(style).toBeDefined();
      expect(typeof style).toBe('object');
      expect(style).toHaveProperty('color');
      expect(style).toHaveProperty('bgcolor');
      expect(style).toHaveProperty('borderRadius');
    });

    it('should have correct style properties', () => {
      expect(style.borderRadius).toBe('8px');
      expect(style.color).toBe('#1f2937');
      expect(style.bgcolor).toBe('#ffffff');
    });
  });

  describe('cancelStyle', () => {
    it('should export a valid cancelStyle object', () => {
      expect(cancelStyle).toBeDefined();
      expect(typeof cancelStyle).toBe('object');
      expect(cancelStyle).toHaveProperty('borderRadius');
      expect(cancelStyle).toHaveProperty('fontSize');
      expect(cancelStyle).toHaveProperty('height');
      expect(cancelStyle).toHaveProperty('border');
      expect(cancelStyle).toHaveProperty('color');
      expect(cancelStyle).toHaveProperty('bgcolor');
      expect(cancelStyle).toHaveProperty('marginRight');
      expect(cancelStyle).toHaveProperty('&:hover');
    });

    it('should have correct common properties', () => {
      expect(cancelStyle.borderRadius).toBe('40px');
      expect(cancelStyle.fontSize).toBe('16px');
      expect(cancelStyle.height).toBe('40px');
      expect(cancelStyle.marginRight).toBe('16px');
    });

    it('should have correct hover styles', () => {
      expect(cancelStyle['&:hover']).toHaveProperty('color');
      expect(cancelStyle['&:hover']).toHaveProperty('bgcolor');
      expect(cancelStyle['&:hover']).toHaveProperty('border');
    });
  });

  describe('acceptStyle', () => {
    it('should export a valid acceptStyle object', () => {
      expect(acceptStyle).toBeDefined();
      expect(typeof acceptStyle).toBe('object');
      expect(acceptStyle).toHaveProperty('borderRadius');
      expect(acceptStyle).toHaveProperty('fontSize');
      expect(acceptStyle).toHaveProperty('height');
      expect(acceptStyle).toHaveProperty('color');
      expect(acceptStyle).toHaveProperty('bgcolor');
      expect(acceptStyle).toHaveProperty('&:hover');
      // Check for disabled property by key
      expect(Object.keys(acceptStyle)).toContain('&.Mui-disabled');
    });

    it('should have correct common properties', () => {
      expect(acceptStyle.borderRadius).toBe('40px');
      expect(acceptStyle.fontSize).toBe('16px');
      expect(acceptStyle.height).toBe('40px');
    });

    it('should have correct disabled styles', () => {
      expect(acceptStyle['&.Mui-disabled']).toHaveProperty('color');
      expect(acceptStyle['&.Mui-disabled']).toHaveProperty('bgcolor');
      expect(acceptStyle['&.Mui-disabled'].color).toBe('#ffffff');
      expect(acceptStyle['&.Mui-disabled'].bgcolor).toBe('#6b7280');
    });
  });

  describe('textStyles', () => {
    it('should export a valid textStyles object', () => {
      expect(textStyles).toBeDefined();
      expect(typeof textStyles).toBe('object');
      expect(textStyles).toHaveProperty('color');
      expect(textStyles).toHaveProperty('fontSize');
      expect(textStyles).toHaveProperty('textAlign');
      expect(textStyles).toHaveProperty('fontWeight');
    });

    it('should have correct text style properties', () => {
      expect(textStyles.color).toBe('#9ca3af');
      expect(textStyles.fontSize).toBe('16px');
      expect(textStyles.textAlign).toBe('justify');
      expect(textStyles.fontWeight).toBe('normal');
    });
  });
});