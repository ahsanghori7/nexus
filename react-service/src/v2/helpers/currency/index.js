const currencyConfig = {
  '£': {
    style: 'currency',
    currency: 'GBP',
    currencyDisplay: 'narrowSymbol',
  },
  $: {
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

const parseCurrency = (value, props = {}) => {
  if (!value && Number(value) !== 0) return value;

  const formatter = new Intl.NumberFormat('en-GB', props);
  const newValue = value ? parseFloat(value) : 0;
  return formatter.format(newValue);
};

const parseFloatVal = (value) =>
  value ? parseFloat(value.toString().replace(/,/g, '')) : value;

const metricSystemFormat = (number) => {
  const suffix = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  const factor = 1000;
  let index = 0;

  while (number >= factor && index < suffix.length - 1) {
    number /= factor;
    index++;
  }

  return number.toFixed(2) + suffix[index];
};

export default parseCurrency;
export { parseFloatVal, metricSystemFormat, currencyConfig };
