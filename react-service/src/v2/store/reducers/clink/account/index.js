import { createSlice } from '@reduxjs/toolkit';
import flag from 'v2/helpers/flags';
import tagManagerArgs from 'v2/helpers/gtm';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import clarityHelper from 'v2/helpers/clarity';
import {
  superAdmin,
  admin,
  manager,
  administrator,
  assistant,
} from 'v2/helpers/roles';

/**
 * Build feature flags object from account info
 * @param {Object} info - Account info object containing features array
 * @returns {Object} Processed feature flags
 */
const buildFeatureFlags = (info = {}) => {
  const { features = [] } = info;
  const featureNames = features.map(({ name }) => name);
  const hasFeature = (feature) => featureNames.includes(feature);

  return {
    asiteFolders: hasFeature('ASITE_FOLDERS'),
    accountGroup: hasFeature('ACCOUNT_GROUP'),
    ifs: hasFeature('IFS'),
  };
};

const config = PHPAppClinkGloblals();
const configInfo = config?.info || {};
const hasInfo = config && config.info && config.info.id;

let envs = ['production'];
if (CLARITY && CLARITY.DEBUG) {
  envs = ['staging', 'uat', 'production'];
}
if (CLARITY && CLARITY.PROJECT_ID && ENV && envs.includes(ENV) && hasInfo) {
  const set = () => {
    clarity('set', 'environment', ENV);
    clarity('set', 'account_id', String(hasInfo));
    clarity('set', 'app', 'app.c-link');
  };
  clarityHelper(set);
}
if (flag('GMT_ID') && hasInfo) {
  tagManagerArgs({
    ...configInfo,
    environment: ENV,
  });
}

const getUserRoleValue = (user = {}) =>
  (user.type || user.role?.value || '').trim();

const hasRoleAccess = (user = {}, allowedRoleValues = []) => {
  const userRoleValue = getUserRoleValue(user);
  if (userRoleValue && allowedRoleValues.includes(userRoleValue)) {
    return true;
  }

  return false;
};

const buildAcl = (info = {}) => {
  const { features = [], user = {} } = info;
  const featureNames = features.map(({ name }) => name);
  const hasFeature = (feature) => featureNames.includes(feature);

  const companyAssetsEnabled = hasFeature('ACL_COMPANY_ASSETS');
  const projectListEnabled = hasFeature('ACL_PROJECT_LIST');
  const companyProfileEnabled = hasFeature('ACL_COMPANY_PROFILE_VIEW');
  const notificationsEnabled = hasFeature('IN_APP_NOTIFICATIONS');
  const aclEnabled = hasFeature('ACL');
  return {
    companyAssets: {
      enabled: companyAssetsEnabled,
      canAccess:
        !companyAssetsEnabled ||
        hasRoleAccess(user, [
          administrator.value,
          superAdmin.value,
          admin.value,
        ]),
    },
    projectList: {
      enabled: projectListEnabled,
      canView:
        !projectListEnabled ||
        hasRoleAccess(user, [
          administrator.value,
          superAdmin.value,
          manager.value,
          admin.value,
        ]),
      canEdit:
        !projectListEnabled ||
        hasRoleAccess(user, [
          administrator.value,
          superAdmin.value,
          manager.value,
          assistant.value,
        ]),
    },
    companyProfile: {
      enabled: companyProfileEnabled,
      canView:
        !companyProfileEnabled ||
        hasRoleAccess(user, [administrator.value, superAdmin.value]),
    },
    createProject: {
      enabled: aclEnabled,
      canView:
        !aclEnabled ||
        hasRoleAccess(user, [superAdmin.value, manager.value, admin.value ,administrator.value]),
    },
    archiveProject: {
      enabled: aclEnabled,
      canArchive:
        !aclEnabled ||
        hasRoleAccess(user, [superAdmin.value, manager.value, admin.value ,administrator.value]),
    },
    notifications: {
      enabled: notificationsEnabled,
      },
  };
};

const initialState = {
  ...(config.info || {}),
  acl: buildAcl(config.info),
  featureFlags: buildFeatureFlags(config.info),
};

const clinkAccountSlice = createSlice({
  name: 'clinkAccount',
  initialState,
  reducers: {},
  extraReducers: {},
});

export {
  initialState as clinkAccountInitialState,
  buildAcl as buildClinkAcl,
  buildFeatureFlags as buildClinkFeatureFlags,
};
export default clinkAccountSlice.reducer;
