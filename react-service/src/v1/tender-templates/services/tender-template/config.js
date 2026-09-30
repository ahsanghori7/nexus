import * as Yup from 'yup';
import { getConfig, ValidationSchemes } from '../../../global/services/clink';

const defaultConfig = getConfig({
  initialValues: {
    asset: '',
    tender: '',
  },
  formFields: [
    {
      key: 'asset',
      as: 'select',
      name: 'asset',
      placeholder: 'Select type',
      label: 'Choose the type of tender',
      options: [],
      isMulti: false,
      required: true,
    },
    {
      key: 'tender',
      as: 'select',
      name: 'tender',
      placeholder: 'Select package',
      label: 'Choose the package for which the tender is issued',
      options: [],
      isMulti: false,
      required: true,
    },
  ],
  validationSchema: Yup.object().shape({
    asset: ValidationSchemes.select,
    tender: ValidationSchemes.select,
  }),
  submitUrl: '',
  method: 'POST',
});

export default defaultConfig;
