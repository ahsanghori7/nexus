import * as Yup from 'yup';
import { ValidationSchemes } from '../../clink';
import {
  DATE_FORMAT_PLACEHOLDER,
  DATE_FORMAT,
} from '../../../helpers/constants';

const PRICING_DOCUMENTS = {
  INITIAL_VALUES: {
    packages: [],
    ownPackages: [],
    pricingReturnedDate: '',
    comments: '',
  },
  FORM_FIELDS: [
    {
      key: 'packages',
      type: 'checkbox',
      name: 'packages',
      label:
        'Select the packages for which you would like us to produce a measure',
      className: 'packages',
      options: [],
      required: true,
    },
    {
      key: 'pricingReturnedDate',
      type: 'text',
      name: 'pricingReturnedDate',
      label: 'When do you want the pricing document returned?',
      className: 'pricing-returned-date',
      dateFormat: DATE_FORMAT,
      placeholder: DATE_FORMAT_PLACEHOLDER,
      calendar: true,
      required: true,
    },
    {
      key: 'comments',
      type: 'textarea',
      name: 'comments',
      label:
        'Would you like to provide further comments regarding the pricing document?',
      className: 'comments',
      placeholder: 'Additional comments',
      rows: 5,
    },
  ],
  VALIDATION_SCHEMA: Yup.object().shape({
    packages: ValidationSchemes.arrayRequired,
    pricingReturnedDate: ValidationSchemes.basicDate,
  }),
};

export default PRICING_DOCUMENTS;
