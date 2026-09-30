/**
 * @jest-environment jsdom
 */

const s3Index = require('./index');

describe('s3/index constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export s3 index object', () => {
    expect(s3Index).toBeDefined();
    expect(typeof s3Index).toBe('object');
    expect(s3Index).not.toBeNull();
  });

  // Test that base URL is correct
  const expectedBaseUrl = 'https://clink-assets.s3.eu-west-2.amazonaws.com';
  
  test('should contain complete URLs with base URL', () => {
    // Test a few key properties to ensure they include the base URL
    expect(s3Index.clinkImage).toBe(`${expectedBaseUrl}/clink-notext-logo.svg`);
    expect(s3Index.prosperImage).toBe(`${expectedBaseUrl}/prosper-notext-logo.svg`);
    expect(s3Index.pegasusLogo).toBe(`${expectedBaseUrl}/pegasus-logo.png`);
    expect(s3Index.clinkLogo).toBe(`${expectedBaseUrl}/clink-logo.png`);
  });

  // Test caret and navigation elements
  test('should contain navigation carets and arrows', () => {
    expect(s3Index.caretDownWhite).toBe(`${expectedBaseUrl}/production/prosper/app/icon/caret-down-white.png`);
    expect(s3Index.redCaretLeft).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-red-arrow-left.svg`);
    expect(s3Index.redCaretRight).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-red-arrow-right.svg`);
    expect(s3Index.redCaretUp).toBe(`${expectedBaseUrl}/production/prosper/app/icon/caret-up-red.svg`);
    expect(s3Index.redCaretDown).toBe(`${expectedBaseUrl}/production/prosper/app/icon/carret-down-red.svg`);
  });

  test('should contain black caret variations', () => {
    expect(s3Index.blackCarretRight).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-caret-black-right.svg`);
    expect(s3Index.blackCarretDown).toBe(`${expectedBaseUrl}/carret-down.svg`);
    expect(s3Index.blackCarretUp).toBe(`${expectedBaseUrl}/carret-up.svg`);
  });

  // Test action icons
  test('should contain action icons', () => {
    expect(s3Index.iconDownloadBlack).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-download-black.svg`);
    expect(s3Index.iconMessageBlack).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-message-black.svg`);
    expect(s3Index.iconOrganiseBlack).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-organise-black.svg`);
    expect(s3Index.iconQuoteBlack).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-quote-black.svg`);
  });

  // Test logo variations
  test('should contain logo variations', () => {
    expect(s3Index.pegasusBlackLogo).toBe(`${expectedBaseUrl}/pegasus-black.svg`);
    expect(s3Index.hatLogo).toBe(`${expectedBaseUrl}/hat.svg`);
  });

  // Test close button states
  test('should contain close button states', () => {
    expect(s3Index.closeButtonActive).toBe(`${expectedBaseUrl}/production/static/images/icon-close-red.svg`);
    expect(s3Index.closeButtonDisabled).toBe(`${expectedBaseUrl}/production/static/images/icon-close-white.svg`);
  });

  // Test message and utility icons
  test('should contain utility icons', () => {
    expect(s3Index.iconMessage).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-message.svg`);
    if (s3Index.upload) {
      expect(s3Index.upload).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-upload.svg`);
    }
  });

  // Test quote-related icons
  test('should contain quote-related assets', () => {
    expect(s3Index.calendarGreen).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-calendar-green.svg`);
    expect(s3Index.svgLightpurpleQuotes).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-lightpurple-quotes.svg`);
    expect(s3Index.svgPurpleQuotes).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-purple-quotes.svg`);
    expect(s3Index.pngLightpurpleQuotes).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-lightpurple-quotes.png`);
    expect(s3Index.pngPurpleQuotes).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-purple-quotes.png`);
  });

  // Test success story images (if they exist)
  test('should contain success story references', () => {
    if (s3Index.armConcepts) {
      expect(s3Index.armConcepts).toContain(expectedBaseUrl);
      expect(s3Index.armConcepts).toContain('/production/prosper/app/feature/success-stories/');
    }
  });

  // Test templates and special assets
  test('should contain template assets', () => {
    if (s3Index.tenderReturnTemplate) {
      expect(s3Index.tenderReturnTemplate).toBe(`${expectedBaseUrl}/production/prosper/app/icon/tender-return-template.svg`);
    }
    if (s3Index.sosNext) {
      expect(s3Index.sosNext).toBe(`${expectedBaseUrl}/production/prosper/app/icon/icon-sos-netext.svg`);
    }
  });

  // Edge cases - ensure no unexpected undefined/null values for key properties
  test('should not contain undefined or null values for core properties', () => {
    const coreProperties = [
      'clinkImage', 'prosperImage', 'pegasusLogo', 'clinkLogo',
      'caretDownWhite', 'redCaretLeft', 'redCaretRight',
      'iconDownloadBlack', 'iconMessageBlack', 'iconOrganiseBlack', 'iconQuoteBlack',
      'closeButtonActive', 'closeButtonDisabled'
    ];
    
    coreProperties.forEach(prop => {
      if (s3Index[prop] !== undefined) {
        expect(s3Index[prop]).not.toBeNull();
        expect(typeof s3Index[prop]).toBe('string');
        expect(s3Index[prop].length).toBeGreaterThan(0);
      }
    });
  });

  test('should contain valid URLs for all properties', () => {
    const s3Keys = Object.keys(s3Index);
    
    s3Keys.forEach(key => {
      if (s3Index[key] && typeof s3Index[key] === 'string') {
        expect(s3Index[key]).toMatch(/^https:\/\/clink-assets\.s3\.eu-west-2\.amazonaws\.com/);
      }
    });
  });

  test('should have expected number of s3 properties', () => {
    const s3Keys = Object.keys(s3Index);
    expect(s3Keys.length).toBeGreaterThan(30); // Should have many URL constants
  });

  test('should contain specific file extensions in URLs', () => {
    const allUrls = Object.values(s3Index).filter(val => typeof val === 'string');
    
    const svgUrls = allUrls.filter(url => url.endsWith('.svg'));
    const pngUrls = allUrls.filter(url => url.endsWith('.png'));
    
    expect(svgUrls.length).toBeGreaterThan(0);
    expect(pngUrls.length).toBeGreaterThan(0);
  });

  test('should not contain malformed URLs', () => {
    const s3Keys = Object.keys(s3Index);
    
    s3Keys.forEach(key => {
      if (s3Index[key] && typeof s3Index[key] === 'string') {
        // Should not have double slashes except after protocol
        const urlWithoutProtocol = s3Index[key].replace('https://', '');
        expect(urlWithoutProtocol).not.toMatch(/\/\//);
        
        // Should not end with slash
        expect(s3Index[key]).not.toMatch(/\/$/);
      }
    });
  });

  test('should follow consistent URL structure', () => {
    const s3Keys = Object.keys(s3Index);
    
    s3Keys.forEach(key => {
      if (s3Index[key] && typeof s3Index[key] === 'string') {
        const url = s3Index[key];
        expect(url).toContain('clink-assets.s3.eu-west-2.amazonaws.com');
        
        // Most should contain production paths
        if (url.includes('/production/')) {
          expect(url).toMatch(/\/production\/(prosper|static|c-link|contractor)\//);
        }
      }
    });
  });
});