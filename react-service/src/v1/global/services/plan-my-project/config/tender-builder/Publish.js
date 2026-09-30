import * as Yup from 'yup';
import { ValidationSchemes } from '../../../clink';

const TENDER_BUILDER_PUBLISH = {
  INITIAL_VALUES: {
    pricingDocument: '',
  },
  FORM_FIELDS: [
    {
      key: 'pricingDocument',
      type: 'radio',
      name: 'pricingDocument',
      className: 'pricing-document-radio',
      options: [
        { value: 1, label: 'Yes', id: 'yes' },
        { value: 0, label: 'No', id: 'no' },
      ],
    },
  ],
  VALIDATION_SCHEMA: Yup.object().shape({
    pricingDocument: ValidationSchemes.arrayRequired,
  }),
};

export default TENDER_BUILDER_PUBLISH;
