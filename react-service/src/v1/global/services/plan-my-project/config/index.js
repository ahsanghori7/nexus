import * as Yup from 'yup';
import { getConfig } from '../../clink';
import GENERAL_INFO from './GeneralInfo';
import SITE_DETAILS from './SiteDetails';
import PACKAGE_COLLATOR from './PackageCollator';

const INITIAL_VALUES = [
  GENERAL_INFO.INITIAL_VALUES,
  SITE_DETAILS.INITIAL_VALUES,
  PACKAGE_COLLATOR.INITIAL_VALUES,
];

const defaultConfig = getConfig({
  initialValues: {
    ...GENERAL_INFO.INITIAL_VALUES,
    ...SITE_DETAILS.INITIAL_VALUES,
    ...PACKAGE_COLLATOR.INITIAL_VALUES,
  },
  formFields: [
    GENERAL_INFO.FORM_FIELDS,
    SITE_DETAILS.FORM_FIELDS,
    PACKAGE_COLLATOR.FORM_FIELDS,
    [],
  ],
  validationSchema: [
    GENERAL_INFO.VALIDATION_SCHEMA,
    SITE_DETAILS.VALIDATION_SCHEMA,
    PACKAGE_COLLATOR.VALIDATION_SCHEMA,
    Yup.object().shape(),
  ],
  submitUrl: `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=addProject`,
  submitUrls: [
    `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=addProject`,
    `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=updateProject&pid=`,
    `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=createDefaultTrades&pid=`,
  ],
  method: 'PATCH',
});

export default defaultConfig;
export { INITIAL_VALUES };
