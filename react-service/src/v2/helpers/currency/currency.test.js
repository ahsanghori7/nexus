import parseCurrency, {
  parseFloatVal,
  metricSystemFormat,
  currencyConfig,
} from './index';

describe('parseCurrency', () => {
  it('returns "0" if value is null', () => {
    expect(parseCurrency(null)).toBe('0');
  });

  it('returns the original value if value is undefined', () => {
    expect(parseCurrency(undefined)).toBeUndefined();
  });

  it('returns 0 formatted as currency if value is 0', () => {
    expect(parseCurrency(0)).toBe('0');
  });

  it('formats a number into GBP currency by default', () => {
    expect(parseCurrency(1234.56)).toBe('1,234.56');
  });

  it('formats a number into USD currency when specified', () => {
    expect(parseCurrency(1234.56, currencyConfig.$)).toBe('$1,234.56');
  });

  it('formats a number into EUR currency when specified', () => {
    expect(parseCurrency(1234.56, currencyConfig['€'])).toBe('€1,234.56');
  });

  it('handles string inputs by converting them to numbers', () => {
    expect(parseCurrency('1234.56')).toBe('1,234.56');
  });

  it('handles negative values correctly', () => {
    expect(parseCurrency(-1234.56)).toBe('-1,234.56');
  });
});

describe('parseFloatVal', () => {
  it('returns the original value if value is null or undefined or empty string', () => {
    expect(parseFloatVal(null)).toBeNull();
    expect(parseFloatVal(undefined)).toBeUndefined();
    expect(parseFloatVal('')).toBe('');
  });

  it('converts a string with commas to a float', () => {
    expect(parseFloatVal('1,234.56')).toBe(1234.56);
  });

  it('converts a number to a float', () => {
    expect(parseFloatVal(1234.56)).toBe(1234.56);
  });

  it('handles negative values correctly', () => {
    expect(parseFloatVal('-1,234.56')).toBe(-1234.56);
  });
});

describe('metricSystemFormat', () => {
  it('formats numbers less than 1000 without a suffix', () => {
    expect(metricSystemFormat(999)).toBe('999.00');
  });

  it('formats numbers in thousands with a "K" suffix', () => {
    expect(metricSystemFormat(1000)).toBe('1.00K');
    expect(metricSystemFormat(123456)).toBe('123.46K');
  });

  it('formats numbers in millions with an "M" suffix', () => {
    expect(metricSystemFormat(1000000)).toBe('1.00M');
    expect(metricSystemFormat(123456789)).toBe('123.46M');
  });

  it('formats numbers in billions with a "G" suffix', () => {
    expect(metricSystemFormat(1000000000)).toBe('1.00G');
  });

  it('formats numbers in trillions with a "T" suffix', () => {
    expect(metricSystemFormat(1000000000000)).toBe('1.00T');
  });

  it('formats numbers in quadrillions with a "P" suffix', () => {
    expect(metricSystemFormat(1000000000000000)).toBe('1.00P');
  });

  it('formats numbers in quintillions with an "E" suffix', () => {
    expect(metricSystemFormat(1000000000000000000)).toBe('1.00E');
  });

  it('handles negative values correctly', () => {
    expect(metricSystemFormat(-1000)).toBe('-1000.00');
  });

  it('handles zero correctly', () => {
    expect(metricSystemFormat(0)).toBe('0.00');
  });
});
