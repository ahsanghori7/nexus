/**
 * @jest-environment jsdom
 */

// Note: wistia.js uses ES6 export, so we need to import it differently
import WISTIA from './wistia';

describe('wistia constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export WISTIA object', () => {
    expect(WISTIA).toBeDefined();
    expect(typeof WISTIA).toBe('object');
    expect(WISTIA).not.toBeNull();
  });

  // Test basic configuration URLs
  test('should contain Wistia configuration URLs', () => {
    expect(WISTIA.CONFIG_URL).toBe('https://fast.wistia.com/assets/external/E-v1.js');
    expect(WISTIA.CONFIG_MEDIA_URL).toBe('https://fast.wistia.com/embed/medias/');
    expect(WISTIA.CONFIG_MEDIA_EXT).toBe('.jsonp');
  });

  // Test specific video IDs
  test('should contain specific video identifiers', () => {
    expect(WISTIA.NO_VIEW_ENQUIRIES).toBe('xo066abb2x');
    expect(WISTIA.WHAT_ARE_TOKENS_MODAL).toBe('48k33gepgr');
  });

  test('should contain success video array', () => {
    expect(Array.isArray(WISTIA.SUCCESS)).toBe(true);
    expect(WISTIA.SUCCESS).toEqual(['h10pl8exzo', 'pnhgy75cfj', 'nnchpg8g19']);
    expect(WISTIA.SUCCESS.length).toBe(3);
  });

  // Test WHAT_ARE_TOKENS object
  test('should contain WHAT_ARE_TOKENS with video URLs', () => {
    expect(WISTIA.WHAT_ARE_TOKENS).toBeDefined();
    expect(typeof WISTIA.WHAT_ARE_TOKENS).toBe('object');
    
    expect(WISTIA.WHAT_ARE_TOKENS.B).toBe('https://clink-assets.s3.eu-west-2.amazonaws.com/production/prosper/videos/Tokens+video+1.mp4');
    expect(WISTIA.WHAT_ARE_TOKENS.A).toBe('https://clink-assets.s3.eu-west-2.amazonaws.com/production/prosper/videos/Token+video+2.mp4');
  });

  // Test HOW_IT_WORKS structure
  test('should contain HOW_IT_WORKS with SHOW array', () => {
    expect(WISTIA.HOW_IT_WORKS).toBeDefined();
    expect(WISTIA.HOW_IT_WORKS.SHOW).toBeDefined();
    expect(Array.isArray(WISTIA.HOW_IT_WORKS.SHOW)).toBe(true);
    expect(WISTIA.HOW_IT_WORKS.SHOW.length).toBe(4);
  });

  test('should contain HOW_IT_WORKS with HIDDEN array', () => {
    expect(WISTIA.HOW_IT_WORKS.HIDDEN).toBeDefined();
    expect(Array.isArray(WISTIA.HOW_IT_WORKS.HIDDEN)).toBe(true);
    expect(WISTIA.HOW_IT_WORKS.HIDDEN.length).toBe(4);
  });

  // Test SHOW array items structure
  test('should have correct structure for SHOW items', () => {
    const showItems = WISTIA.HOW_IT_WORKS.SHOW;
    
    showItems.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('link');
      
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.link).toBe('string');
      
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.link).toContain('wistia_embed');
    });
  });

  test('should have specific SHOW item content', () => {
    const showItems = WISTIA.HOW_IT_WORKS.SHOW;
    
    expect(showItems[0].id).toBe('csf0pcmd21');
    expect(showItems[0].title).toBe('Messaging');
    
    expect(showItems[1].id).toBe('utsgj1fn3a');
    expect(showItems[1].title).toBe('Live projects and tokens');
    
    expect(showItems[2].title).toBe('Prequalification');
    expect(showItems[3].title).toBe('Enquiries and Quotes');
  });

  // Test HIDDEN array items structure
  test('should have correct structure for HIDDEN items', () => {
    const hiddenItems = WISTIA.HOW_IT_WORKS.HIDDEN;
    
    hiddenItems.forEach((item) => {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('link');
      
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.link).toBe('string');
      
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.link).toContain('wistia_embed');
    });
  });

  // Edge cases - ensure no unexpected undefined/null values
  test('should not contain undefined or null values in main properties', () => {
    expect(WISTIA.CONFIG_URL).toBeDefined();
    expect(WISTIA.CONFIG_MEDIA_URL).toBeDefined();
    expect(WISTIA.CONFIG_MEDIA_EXT).toBeDefined();
    expect(WISTIA.NO_VIEW_ENQUIRIES).toBeDefined();
    expect(WISTIA.SUCCESS).toBeDefined();
    expect(WISTIA.WHAT_ARE_TOKENS).toBeDefined();
    expect(WISTIA.WHAT_ARE_TOKENS_MODAL).toBeDefined();
    expect(WISTIA.HOW_IT_WORKS).toBeDefined();
  });

  test('should contain valid URLs', () => {
    expect(WISTIA.CONFIG_URL).toMatch(/^https:\/\//);
    expect(WISTIA.CONFIG_MEDIA_URL).toMatch(/^https:\/\//);
    expect(WISTIA.WHAT_ARE_TOKENS.A).toMatch(/^https:\/\//);
    expect(WISTIA.WHAT_ARE_TOKENS.B).toMatch(/^https:\/\//);
  });

  test('should have consistent Wistia embed link format', () => {
    const allLinks = [
      ...WISTIA.HOW_IT_WORKS.SHOW.map(item => item.link),
      ...WISTIA.HOW_IT_WORKS.HIDDEN.map(item => item.link)
    ];
    
    allLinks.forEach(link => {
      expect(link).toContain('wistia_embed');
      expect(link).toContain('wistia_async_');
      expect(link).toContain('popover=true');
    });
  });
});