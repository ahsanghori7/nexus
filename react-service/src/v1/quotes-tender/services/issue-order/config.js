import * as Yup from 'yup';
import { getConfig, ValidationSchemes } from '../../../global/services/clink';

const defaultConfig = getConfig({
  initialValues: {
    issue_order: '',
  },
  formFields: [
    {
      key: 'issue_order',
      as: 'select',
      name: 'issue_order',
      placeholder: 'Please select an template',
      label: 'Type of order',
      options: [],
      required: true,
    },
  ],
  validationSchema: Yup.object().shape({
    issue_order: ValidationSchemes.select,
  }),
  submitUrl: '',
  method: 'POST',
});

export default defaultConfig;
