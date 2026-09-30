import * as Yup from 'yup';
import i18next from 'v2/helpers/i18n';
import { getConfig, ValidationSchemes } from '../../../global/services/clink';

const defaultConfig = getConfig({
  initialValues: {
    order_value: '',
    order_date: null,
  },
  formFields: [
    {
      key: 'order_value',
      type: 'text',
      name: 'order_value',
      placeholder: `${i18next.t('currency')}0.00`,
      label: 'Final Order Value',
      required: true,
    },
    {
      key: 'order_date',
      type: 'text',
      name: 'order_date',
      label: 'Order date',
      className: 'start-date',
      placeholder: 'DD / MM / YYYY',
      calendar: true,
      required: true,
    },
  ],
  validationSchema: Yup.object().shape({
    order_value: ValidationSchemes.moneyNoZero,
    order_date: Yup.mixed(),
  }),
  submitUrl: '',
  method: 'POST',
});

export default defaultConfig;
