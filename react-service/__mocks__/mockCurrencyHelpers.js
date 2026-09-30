// Mock for currency helpers
export const currencyConfig = {
  '£': {
    style: 'currency',
    currency: 'GBP',
    currencyDisplay: 'narrowSymbol',
  },
  '$': {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
  },
  '€': {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'narrowSymbol',
  },
};

export const parseFloatVal = jest.fn((value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  }
  return 0;
});

const parseCurrency = jest.fn((value, props = {}) => {
  if (!value && Number(value) !== 0) return '';
  const numValue = value ? parseFloat(value) : 0;
  return numValue.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

export default parseCurrency;
