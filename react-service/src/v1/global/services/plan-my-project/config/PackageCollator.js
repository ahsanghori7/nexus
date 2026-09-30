import * as Yup from 'yup';

const PACKAGE_COLLATOR = {
  INITIAL_VALUES: {
    documents: [],
  },
  FORM_FIELDS: [
    {
      key: 'documents',
      type: 'multi-dropzone',
      name: 'documents',
      className: 'dropzone-documents',
      showProgressBar: true,
      values: [],
    },
  ],
  VALIDATION_SCHEMA: Yup.object().shape(),
};

export default PACKAGE_COLLATOR;
