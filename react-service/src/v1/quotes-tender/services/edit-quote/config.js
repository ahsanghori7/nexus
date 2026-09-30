import * as Yup from 'yup';
import { getConfig, ValidationSchemes } from '../../../global/services/clink';

const defaultConfig = (currency) =>
  getConfig({
    initialValues: {
      price: '',
      measured_work: '',
      prelims: '',
      other_items: '',
      programme: '',
    },
    formFields: [
      {
        key: 'price',
        type: 'text',
        name: 'price',
        placeholder: `${currency} 00.00`,
        label: 'What is the overall quote value?',
        className: 'overall-quote-value',
        required: true,
      },
      {
        key: 'measured_work',
        type: 'text',
        name: 'measured_work',
        placeholder: `${currency} 00.00`,
        label: 'What is the measured works value?',
        className: 'measure-work-value',
        required: true,
      },
      {
        key: 'prelims',
        type: 'text',
        name: 'prelims',
        placeholder: `${currency} 00.00`,
        label: 'What is the value of prelims?',
        className: 'prelims',
        required: true,
      },
      {
        key: 'other_items',
        type: 'text',
        name: 'other_items',
        placeholder: `${currency} 00.00`,
        label: 'What is the value of Provisional / Other sums?',
        className: 'other-sums',
        required: true,
      },
      {
        key: 'programme',
        type: 'text',
        name: 'programme',
        label: 'How long is the Programme? (Weeks)',
        className: 'programme',
        required: true,
        info: 'For part weeks e.g 12 days, input 2.4',
      },
    ],
    validationSchema: Yup.object().shape({
      price: ValidationSchemes.money,
      measured_work: ValidationSchemes.money,
      prelims: ValidationSchemes.money,
      other_items: ValidationSchemes.money,
      programme: ValidationSchemes.requiredNumber,
    }),
    submitUrl: '',
    method: 'PATCH',
  });

export default defaultConfig;
