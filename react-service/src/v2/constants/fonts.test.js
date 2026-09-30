/**
 * @jest-environment jsdom
 */

const fonts = require('./fonts');

describe('fonts constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export fonts object', () => {
    expect(fonts).toBeDefined();
    expect(typeof fonts).toBe('object');
    expect(fonts).not.toBeNull();
  });

  // Test basic font constants
  test('should contain base font family', () => {
    expect(fonts.sansSerif).toBe('sans-serif');
    expect(typeof fonts.sansSerif).toBe('string');
  });

  // Test complex font stacks
  test('should contain complete font stacks with fallbacks', () => {
    expect(fonts.avantGardeGothicPRO).toBe('itc-avant-garde-gothic-pro, sans-serif');
    expect(fonts.ptSans).toBe('pt-sans, sans-serif');
    expect(fonts.quatro).toBe('quatro, sans-serif');
    expect(fonts.sofia).toBe('sofia-pro-soft, sans-serif');
  });

  test('should contain proxima font variations', () => {
    expect(fonts.proxima_nova1).toBe('proxima-nova');
    expect(fonts.proxima_nova2).toBe('proxima_nova');
    expect(fonts.proxima).toBe('proxima-nova, proxima_nova, sans-serif');
  });

  test('should contain Rooney Sans font', () => {
    expect(fonts.rooneySans).toBe('Rooney Sans');
  });

  // Test that all font stacks include fallbacks (except single font names)
  test('should include sans-serif fallback in composite font stacks', () => {
    const fontStacksWithFallbacks = [
      'avantGardeGothicPRO',
      'ptSans', 
      'quatro',
      'proxima',
      'sofia'
    ];

    fontStacksWithFallbacks.forEach(fontKey => {
      expect(fonts[fontKey]).toContain('sans-serif');
    });
  });

  // Edge cases - ensure no unexpected undefined/null values
  test('should not contain undefined or null values', () => {
    const fontKeys = Object.keys(fonts);
    
    fontKeys.forEach(key => {
      expect(fonts[key]).toBeDefined();
      expect(fonts[key]).not.toBeNull();
      expect(typeof fonts[key]).toBe('string');
      expect(fonts[key].length).toBeGreaterThan(0);
    });
  });

  test('should contain expected number of font properties', () => {
    const fontKeys = Object.keys(fonts);
    expect(fontKeys.length).toBe(9); // Based on the file structure
  });

  test('should have consistent font naming patterns', () => {
    // Test that expected font properties exist
    expect(fonts).toHaveProperty('sansSerif');
    expect(fonts).toHaveProperty('avantGardeGothicPRO');
    expect(fonts).toHaveProperty('ptSans');
    expect(fonts).toHaveProperty('quatro');
    expect(fonts).toHaveProperty('proxima_nova1');
    expect(fonts).toHaveProperty('proxima_nova2');
    expect(fonts).toHaveProperty('proxima');
    expect(fonts).toHaveProperty('sofia');
    expect(fonts).toHaveProperty('rooneySans');
  });

  test('should not contain empty strings', () => {
    const fontKeys = Object.keys(fonts);
    
    fontKeys.forEach(key => {
      expect(fonts[key].trim()).not.toBe('');
    });
  });

  test('should have valid CSS font family format', () => {
    const fontKeys = Object.keys(fonts);
    
    fontKeys.forEach(key => {
      // Should not start or end with comma
      expect(fonts[key]).not.toMatch(/^,/);
      expect(fonts[key]).not.toMatch(/,$/);
      
      // Should not have double commas
      expect(fonts[key]).not.toMatch(/,,/);
    });
  });
});