import * as Yup from 'yup';
import { getConfig } from '../../../../global/services/clink';

const defaultConfig = getConfig({
  initialValues: {},
  formFields: [],
  validationSchema: Yup.object().shape(),
  submitUrl: '',
  method: 'GET',
});

export default defaultConfig;
