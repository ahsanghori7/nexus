import i18next from 'v2/helpers/i18n';
import pennyToCurrency from 'v2/helpers/currency/v1';

const priceToNum = (price) => {
  let newPrice = price;
  if (typeof newPrice === 'string') {
    newPrice = newPrice
      .replace(/[.£,]/g, '')
      .replace(/[.$,]/g, '')
      .replace(/[.€,]/g, '');
  }
  const num = Number(newPrice);
  return num;
};

const pennyToFloat = (num) => {
  const numStr = String(num).replace('.', '');
  const testOnlyNumber = numStr.replace('-', '');
  if (testOnlyNumber.length < 3) {
    return numStr;
  }

  const value = `${numStr.substring(0, numStr.length - 2)}.${numStr.substring(
    numStr.length - 2
  )}`;
  return value;
};

const numToPrice = (num) => pennyToCurrency(pennyToFloat(num));

const normaliseFormValues = (data, keys) => {
  const values = data;
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(values, k)) {
      let v = String(values[k]);
      v = v.replaceAll(i18next.t('currency'), '');
      const i = v.indexOf('.');
      if (i !== -1) {
        if (v.length - i !== 3) {
          const [p, s] = v.split('.');
          v = `${p}${s.length < 2 ? s.padEnd(2, '0') : v.substring(0, 2)}`;
        }
      } else {
        v = `${v}00`;
      }
      values[k] = Number(v.replace('.', ''));
    }
  });

  return values;
};

const priceValueTest = (value) => {
  if (value.length === 0) {
    return true;
  }

  // Just one dot is allowed
  if (value.split('.').length - 1 > 1) {
    return false;
  }

  return true;
};

const numToPercent = (num) => {
  const currency = pennyToCurrency(num);
  return `${currency}%`.replace('£', '').replace('$', '').replace('€', '');
};

export {
  priceToNum,
  numToPrice,
  priceValueTest,
  pennyToFloat,
  numToPercent,
  normaliseFormValues,
};
