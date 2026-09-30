import i18next from 'v2/helpers/i18n';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import { change, changeProsper } from './func';

global.console = { log: jest.fn() }; // Mock console.log // eslint-disable-line no-console

jest.mock('v2/helpers/i18n', () => ({
  changeLanguage: jest.fn(),
}));

jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock fetch
global.console.error = jest.fn(); // eslint-disable-line no-console

describe('change function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should change language if country code exists', async () => {
    PHPAppClinkGloblals.mockReturnValue({
      info: { country: { code: 'fr' } },
    });

    await change();

    expect(console.log).toHaveBeenCalledWith('Checking language by region...'); // eslint-disable-line no-console
    expect(i18next.changeLanguage).toHaveBeenCalledWith('fr');
    expect(console.log).toHaveBeenCalledWith('Done'); // eslint-disable-line no-console
  });

  it('should not change language if country code is missing', async () => {
    PHPAppClinkGloblals.mockReturnValue({});

    await change();

    expect(console.log).toHaveBeenCalledWith('Checking language by region...'); // eslint-disable-line no-console
    expect(i18next.changeLanguage).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalledWith('Done'); // eslint-disable-line no-console
  });

});

describe('changeProsper', () => {
  beforeEach(() => {
    fetch.mockClear();
    i18next.changeLanguage.mockClear();
  });

  it('should change language when country code is present', async () => {
    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ country: { code: 'fr' } }),
    });

    const result = await changeProsper();
    expect(i18next.changeLanguage).toHaveBeenCalledWith('fr');
    expect(result).toBe('fr');
  });

  it('should return false when country code is missing', async () => {
    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ country: {} }),
    });

    const result = await changeProsper();
    expect(i18next.changeLanguage).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should handle fetch errors gracefully', async () => {
    fetch.mockRejectedValue(new Error('Network Error'));

    const result = await changeProsper();
    expect(i18next.changeLanguage).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith( // eslint-disable-line no-console
        'Error calling user info endpoint:',
        expect.any(Error)
      );
    expect(result).toBe(false);
  });
});
