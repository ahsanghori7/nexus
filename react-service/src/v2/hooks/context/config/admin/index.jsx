import React from 'react';
import { ButtonImage, CONSTANTS, Image } from 'clink-components';
import actions from 'store/reducers/actions';
import { goTo, getUrl } from 'v2/helpers/url';
import contractorsActions from './actions/contractors';
import projectsActions from './actions/projects';
import accountsActions from './actions/accounts';
import featuresActions from './actions/features';
import contractorsColumns from './columns/contractors';
import projectsColumns from './columns/projects';
import accountsColumns from './columns/accounts';
import activitiesColumns from './columns/activities';
import opportunitiesColumns from './columns/opportunities';
import engagementAccountColumns from './columns/engagement_account';
import engagementUserColumns from './columns/engagement_user';
import supplyChainColumns from './columns/supply_chain';
import customerHealthScoreColumns from './columns/customer_health_score';
import logsColumns from './columns/logs';
import featuresColumns from './columns/features';
import actionColumn from '../common/actions';
import flag from 'v2/helpers/flags';

const { pegasusLogo, clinkImage, prosperImage, clinkLogo } = CONSTANTS.s3;

const HeaderLogo = () => (
  <>
    <Image height={24} src={pegasusLogo} />
    <div style={{ paddingLeft: '5px' }}>Pegasus</div>
  </>
);
export const HeaderContent = ({ first = true }) => (
  <>
    <ButtonImage
      src={clinkImage}
      active={first}
      handleClick={() => goTo(getUrl('admin', '/dashboard'))}
    />
    <div style={{ paddingLeft: '5px' }}>
      <ButtonImage
        src={prosperImage}
        active={!first}
        handleClick={() => goTo(getUrl('admin_prosper', '/dashboard'))}
      />
    </div>
  </>
);
const admin = {
  pages: {
    home: { path: 'dashboard', keyTitle: 'clink-home-title' },
    dashboard: {
      path: 'dashboard',
      keyTitle: 'clink-dashboard-title',
    },
    users: {
      actions: contractorsActions,
      columns: contractorsColumns,
      actionColumn: { config: actionColumn },
      path: 'contractors',
      keyTitle: 'clink-contractors-title',
    },
    projects: {
      actions: projectsActions,
      columns: projectsColumns,
      actionColumn: { config: actionColumn },
      path: 'projects',
      keyTitle: 'clink-projects-title',
    },
    accounts: {
      actions: accountsActions,
      columns: accountsColumns,
      actionColumn: { config: actionColumn },
      path: 'accounts',
      keyTitle: 'clink-accounts-title',
    },
    customerHealthScore: {
      columns: customerHealthScoreColumns,
      path: 'customer_health_score',
      keyTitle: 'customer-health-dashboard',
    },
    logs: {
      columns: logsColumns,
      path: 'logs',
      keyTitle: 'Logs',
    },
    search: {
      acceptedModels: ['users', 'projects', 'accounts'],
      actionColumn: { config: actionColumn },
      path: 'search',
      keyTitle: 'search-title',
    },
  },
  account: {
    activity: activitiesColumns,
    opportunities: opportunitiesColumns,
    engagement_account: engagementAccountColumns,
    engagement_user: engagementUserColumns,
    supply_chain: supplyChainColumns,
  },
  logo: <Image src={clinkLogo} />,
  config: {
    website: 1,
    typeAccount: 2,
  },
  headerLogo: <HeaderLogo />,
  headerContent: <HeaderContent />,
  actions: actions.admin,
};

if (flag('FEATURES')) {
  admin.pages.features = {
    actions: featuresActions,
    columns: featuresColumns,
    actionColumn: { config: actionColumn },
    path: 'features',
    keyTitle: 'features',
  };
}

export default admin;
