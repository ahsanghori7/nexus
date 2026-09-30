import * as Yup from 'yup';
import { getConfig, ValidationSchemes } from '../../../global/services/clink';

const defaultConfig = getConfig({
  initialValues: {
    template: '',
  },
  formFields: [
    {
      key: 'template',
      type: 'radio',
      name: 'template',
      label: 'Choose a template',
      className: 'select-template',
      options: [],
      required: true,
      toggleButton: false,
    },
  ],
  validationSchema: Yup.object().shape({
    template: ValidationSchemes.required,
  }),
  submitUrl: '',
  method: 'GET',
});

export default defaultConfig;
