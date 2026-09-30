import * as Yup from 'yup';
import { getConfig } from '../../clink';

const defaultConfig = getConfig({
  initialValues: {
    documents: [],
  },
  formFields: [
    {
      key: 'documents',
      type: 'multi-dropzone',
      name: 'documents',
      className: 'dropzone-documents',
      showProgressBar: true,
      values: [],
    },
  ],
  validationSchema: Yup.object().shape(),
  submitUrl: '',
  method: 'GET',
  key: 'PackageCollator',
});

export default defaultConfig;
