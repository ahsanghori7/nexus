/**
 * @jest-environment jsdom
 */

const dictionary = require('./dictionary');

describe('s3/dictionary constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export dictionary object', () => {
    expect(dictionary).toBeDefined();
    expect(typeof dictionary).toBe('object');
    expect(dictionary).not.toBeNull();
  });

  // Test C-Link app icons
  test('should contain C-Link app icons', () => {
    expect(dictionary.requestIcon).toBe('/production/c-link/app/request-icon.svg');
    expect(dictionary.iconCloseGray).toBe('/production/c-link/app/icon-close-gray.svg');
    expect(dictionary.viewProfileCarousel).toBe('/production/c-link/app/view-profile-carousel.svg');
    expect(dictionary.iconEditTurqoise).toBe('/production/c-link/app/icon-edit-turqoise.svg');
  });

  test('should contain C-Link status icons', () => {
    expect(dictionary.iconRoundAwardedLigthgreen).toBe('/production/c-link/app/icon-round-awarded-ligthgreen.svg');
    expect(dictionary.iconRoundEditLigthgreen).toBe('/production/c-link/app/icon-round-edit-ligthgreen.svg');
    expect(dictionary.iconRoundOnsiteLigthgreen).toBe('/production/c-link/app/icon-round-onsite-ligthgreen.svg');
    expect(dictionary.iconRoundQuotedLigthgreen).toBe('/production/c-link/app/icon-round-quoted-ligthgreen.svg');
    expect(dictionary.iconRoundTenderLigthgreen).toBe('/production/c-link/app/icon-round-tender-ligthgreen.svg');
  });

  // Test Prosper icons
  test('should contain Prosper calendar and quote icons', () => {
    expect(dictionary.calendarGreen).toBe('/production/prosper/app/icon/icon-calendar-green.svg');
    expect(dictionary.svgLightpurpleQuotes).toBe('/production/prosper/app/icon/icon-lightpurple-quotes.svg');
    expect(dictionary.svgPurpleQuotes).toBe('/production/prosper/app/icon/icon-purple-quotes.svg');
    expect(dictionary.pngLightpurpleQuotes).toBe('/production/prosper/app/icon/icon-lightpurple-quotes.png');
    expect(dictionary.pngPurpleQuotes).toBe('/production/prosper/app/icon/icon-purple-quotes.png');
  });

  test('should contain navigation arrows and carets', () => {
    expect(dictionary.redCaretLeft).toBe('/production/prosper/app/icon/icon-red-arrow-left.svg');
    expect(dictionary.redCaretRight).toBe('/production/prosper/app/icon/icon-red-arrow-right.svg');
    expect(dictionary.redCaretUp).toBe('/production/prosper/app/icon/caret-up-red.svg');
    expect(dictionary.redCaretDown).toBe('/production/prosper/app/icon/carret-down-red.svg');
  });

  test('should contain black icons for actions', () => {
    expect(dictionary.iconDownloadBlack).toBe('/production/prosper/app/icon/icon-download-black.svg');
    expect(dictionary.iconMessageBlack).toBe('/production/prosper/app/icon/icon-message-black.svg');
    expect(dictionary.iconOrganiseBlack).toBe('/production/prosper/app/icon/icon-organise-black.svg');
    expect(dictionary.iconQuoteBlack).toBe('/production/prosper/app/icon/icon-quote-black.svg');
  });

  // Test logos
  test('should contain various logos', () => {
    expect(dictionary.pegasusBlackLogo).toBe('/pegasus-black.svg');
    expect(dictionary.clinkImage).toBe('/clink-notext-logo.svg');
    expect(dictionary.prosperImage).toBe('/prosper-notext-logo.svg');
    expect(dictionary.pegasusLogo).toBe('/pegasus-logo.png');
    expect(dictionary.hatLogo).toBe('/hat.svg');
    expect(dictionary.clinkLogo).toBe('/clink-logo.png');
  });

  // Test chat-related icons
  test('should contain chat icons', () => {
    expect(dictionary.attachSvg).toBe('/production/prosper/app/icon/chat-attach.svg');
    expect(dictionary.boldSvg).toBe('/production/prosper/app/icon/chat-bold.svg');
    expect(dictionary.italicSvg).toBe('/production/prosper/app/icon/chat-italic.svg');
    expect(dictionary.underlineSvg).toBe('/production/prosper/app/icon/chat-underline.svg');
    expect(dictionary.orderedSvg).toBe('/production/prosper/app/icon/chat-ordered.svg');
    expect(dictionary.unorderedSvg).toBe('/production/prosper/app/icon/chat-unordered.svg');
  });

  // Test close buttons and controls
  test('should contain UI control icons', () => {
    expect(dictionary.closeButtonActive).toBe('/production/static/images/icon-close-red.svg');
    expect(dictionary.closeButtonDisabled).toBe('/production/static/images/icon-close-white.svg');
    expect(dictionary.carretDown).toBe('/carret-down.svg');
    expect(dictionary.carretUp).toBe('/carret-up.svg');
  });

  // Test utility icons
  test('should contain utility icons', () => {
    expect(dictionary.upload).toBe('/production/prosper/app/icon/icon-upload.svg');
    expect(dictionary.addGray).toBe('/production/prosper/app/icon/icon-add-gray.svg');
    expect(dictionary.deleteIconRed).toBe('/production/prosper/app/icon/icon-delete-red.svg');
    expect(dictionary.checkmarkGreen).toBe('/production/prosper/app/icon/icon-check-green.svg');
  });

  // Test info and status icons
  test('should contain info and status icons', () => {
    expect(dictionary.infoLogo).toBe('/production/prosper/app/icon/icon-info.svg');
    expect(dictionary.infoLogoBlack).toBe('/production/prosper/app/icon/icon-info-black.svg');
    expect(dictionary.infoLogoGray).toBe('/production/prosper/app/icon/icon-info-gray.svg');
    expect(dictionary.infoLogoRed).toBe('/production/prosper/app/icon/icon-danger-red.svg');
  });

  // Edge cases - ensure no unexpected undefined/null values
  test('should not contain undefined or null values', () => {
    const dictionaryKeys = Object.keys(dictionary);
    
    dictionaryKeys.forEach(key => {
      expect(dictionary[key]).toBeDefined();
      expect(dictionary[key]).not.toBeNull();
      expect(typeof dictionary[key]).toBe('string');
      expect(dictionary[key].length).toBeGreaterThan(0);
    });
  });

  test('should contain valid file paths', () => {
    const dictionaryKeys = Object.keys(dictionary);
    
    dictionaryKeys.forEach(key => {
      const path = dictionary[key];
      // Should start with / or contain a valid path structure
      expect(path).toMatch(/^\/|\/production\//);
      // Should not have double slashes (except after protocol)
      expect(path).not.toMatch(/\/\//);
    });
  });

  test('should have expected number of dictionary entries', () => {
    const dictionaryKeys = Object.keys(dictionary);
    expect(dictionaryKeys.length).toBeGreaterThan(50); // Should have many path constants
  });

  test('should contain specific file extensions', () => {
    const svgPaths = Object.values(dictionary).filter(path => path.endsWith('.svg'));
    const pngPaths = Object.values(dictionary).filter(path => path.endsWith('.png'));
    const jpgPaths = Object.values(dictionary).filter(path => path.endsWith('.jpg'));
    
    expect(svgPaths.length).toBeGreaterThan(0);
    expect(pngPaths.length).toBeGreaterThan(0);
    expect(jpgPaths.length).toBeGreaterThan(0);
  });

  test('should follow consistent path patterns', () => {
    // Test that Prosper paths follow expected pattern
    const prosperPaths = Object.values(dictionary).filter(path => 
      path.includes('/production/prosper/')
    );
    expect(prosperPaths.length).toBeGreaterThan(0);

    // Test that C-Link paths follow expected pattern
    const clinkPaths = Object.values(dictionary).filter(path => 
      path.includes('/production/c-link/')
    );
    expect(clinkPaths.length).toBeGreaterThan(0);

    // Test that static paths follow expected pattern
    const staticPaths = Object.values(dictionary).filter(path => 
      path.includes('/production/static/')
    );
    expect(staticPaths.length).toBeGreaterThan(0);
  });

  test('should contain specific contractor and success story paths', () => {
    expect(dictionary.iconContractor).toBe('/production/contractor/images/default-icon.png');
    
    // Test a few success story images
    if (dictionary.armConcepts) {
      expect(dictionary.armConcepts).toContain('/production/prosper/app/feature/success-stories/');
    }
  });
});