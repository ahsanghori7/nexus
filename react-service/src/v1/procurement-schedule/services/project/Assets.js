import * as Yup from 'yup';
import { getConfig, ValidationSchemes } from '../../../global/services/clink';

const defaultConfig = getConfig({
  initialValues: { supplyChain: [] },
  formFields: [
    {
      key: 'supplyChain',
      as: 'select',
      name: 'supplyChain',
      label: 'Search subcontractors',
      isMulti: true,
      extractedOptions: true,
      options: [],
    },
  ],
  validationSchema: Yup.object().shape({
    supplyChain: ValidationSchemes.arrayRequired,
  }),
  submitUrl: '',
  method: '',
  key: 'AddSupplyChain',
});

export default defaultConfig;
