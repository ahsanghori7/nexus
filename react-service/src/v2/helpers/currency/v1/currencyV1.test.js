import pennyToCurrency from './index';
import i18next from 'v2/helpers/i18n';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn(),
}));

describe('pennyToCurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should correctly format GBP currency', () => {
    i18next.t.mockReturnValue('£');
    const result = pennyToCurrency(12345); // 123.45 GBP
    expect(result).toBe('£123.45');
  });

  test('should correctly format USD currency', () => {
    i18next.t.mockReturnValue('$');
    const result = pennyToCurrency(5678); // 56.78 USD
    expect(result).toBe('$56.78');
  });

  test('should correctly format EUR currency', () => {
    i18next.t.mockReturnValue('€');
    const result = pennyToCurrency(9876); // 98.76 EUR
    expect(result).toBe('€98.76');
  });

  test('should return 0 when value is undefined or null', () => {
    expect(pennyToCurrency(undefined)).toBe(0);
    expect(pennyToCurrency(null)).toBe(0);
  });

  test('should handle values that already have decimals', () => {
    i18next.t.mockReturnValue('$');
    const result = pennyToCurrency(45.67); // should not divide by 100
    expect(result).toBe('$45.67');
  });

  test('should use provided formatter options if given', () => {
    const customFormatterOpts = {
      style: 'currency',
      currency: 'JPY',
      currencyDisplay: 'narrowSymbol',
    };
    const result = pennyToCurrency(1000, customFormatterOpts); // 10 JPY
    expect(result).toBe('¥10');
  });
});
