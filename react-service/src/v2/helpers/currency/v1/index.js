import i18next from 'v2/helpers/i18n';
import { currencyConfig } from 'v2/helpers/currency';


// TODO: To check if this affects somehow
const locale = 'en-GB';
const pennyToCurrency = (
  value,
  formatterOpts = currencyConfig[i18next.t('currency')]
) => {
  if (value) {
    // we check if it has decimals. If not, we divide it by 100
    const moneyValue = !value.toString().includes('.')
      ? parseFloat(value / 100)
      : value;
    // we use Intl for parsing the number into currency
    const formatter = new Intl.NumberFormat(locale, formatterOpts);
    return formatter.format(moneyValue);
  }
  return 0;
};

export default pennyToCurrency;
export { currencyConfig };
