import React from 'react';
import Box from '@mui/material/Box';
import AdminCLink from 'v2/apps/admin/pages/clink';
import Dashboard from 'v2/apps/admin/pages/clink/Dashboard';
import DashboardIcon from 'assets/images/icons/dashboard.svg';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS, Image } from 'clink-components';
import ProjectsIcon from 'assets/images/icons/house.svg';
import Projects from 'v2/apps/admin/pages/clink/Projects';
import ContractorsIcon from 'assets/images/icons/avatar.svg';
import Contractors from 'v2/apps/admin/pages/clink/Contractors';
import ClinkAccounts from 'v2/apps/admin/pages/clink/Accounts';
import AdminProsper from 'v2/apps/admin/pages/prosper';
import DashboardProsper from 'v2/apps/admin/pages/prosper/dashboard';
import SupplyChainDashboardProsper from 'v2/apps/admin/pages/prosper/dashboard/SupplyChain';
import Accounts from 'v2/apps/admin/pages/prosper/Accounts';
import SearchResults from 'v2/apps/admin/pages/SearchResults';
import DataContent from 'v2/apps/admin/DataContent';
import CustomerHealthScore from 'v2/apps/admin/pages/clink/CustomerHealthScore';
import Features from 'v2/apps/admin/pages/clink/Features';
import flag from 'v2/helpers/flags';
import Logs from './pages/clink/Logs';

const { customerHealthScore } = CONSTANTS.s3;

const EXTERNAL_SUBCONTRACTOR = 4;
const routesAdmin = [
  {
    index: true,
    element: (
      <AdminCLink>
        <Dashboard />
      </AdminCLink>
    ),
  },
  {
    path: 'dashboard',
    element: (
      <AdminCLink>
        <Dashboard />
      </AdminCLink>
    ),
    label: (
      <span data-testid="sidebar-item-dashboard">
        <DashboardIcon /> {i18next.t('clink-dashboard-title')}
      </span>
    ),
  },
  {
    path: 'projects',
    label: (
      <span data-testid="sidebar-item-projects">
        <ProjectsIcon /> {i18next.t('clink-projects-title')}
      </span>
    ),
    element: (
      <AdminCLink model="projects">
        <Projects />
      </AdminCLink>
    ),
  },
  {
    path: 'contractors',
    label: (
      <span data-testid="sidebar-item-contractors">
        <ContractorsIcon /> {i18next.t('clink-contractors-title')}
      </span>
    ),
    element: (
      <AdminCLink model="users">
        <Contractors />
      </AdminCLink>
    ),
  },
  {
    path: 'accounts',
    label: (
      <span data-testid="sidebar-item-clink-accounts">
        <ContractorsIcon /> {i18next.t('clink-accounts-title')}
      </span>
    ),
    element: (
      <AdminCLink model="accounts">
        <ClinkAccounts />
      </AdminCLink>
    ),
  },
  {
    path: 'search',
    element: (
      <AdminCLink>
        <SearchResults contextType="admin" />
      </AdminCLink>
    ),
  },
  {
    path: 'accounts/:accountId',
    element: (
      <AdminCLink>
        <DataContent tabs="admin" contextType="admin" />
      </AdminCLink>
    ),
  },
  {
    path: 'logs',
    label: (
      <span data-testid="sidebar-item-logs">
        <ContractorsIcon /> {i18next.t('clink-logs-title')}
      </span>
    ),
    element: (
      <AdminCLink model="logs">
        <Logs />
      </AdminCLink>
    ),
  },
];

routesAdmin.push({
  path: 'customer_health_score',
  label: (
    <Box
      data-testid="sidebar-item-customer-health-score"
      sx={{
        display: 'flex',
        '& span': {
          marginRight: '0px',
          '& img': {
            width: '16px',
            height: '16px',
          },
        },
      }}
    >
      <Image src={customerHealthScore} />{' '}
      {i18next.t('customer-health-dashboard')}
    </Box>
  ),
  element: (
    <AdminCLink model="customerHealthScore">
      <CustomerHealthScore />
    </AdminCLink>
  ),
});

if (flag('FEATURES')) {
  routesAdmin.push({
    path: 'features',
    label: (
      <Box
        data-testid="sidebar-item-features"
        sx={{
          display: 'flex',
          '& span': {
            marginRight: '0px',
            '& img': {
              width: '16px',
              height: '16px',
            },
          },
        }}
      >
        <Image src={customerHealthScore} /> {i18next.t('features')}
      </Box>
    ),
    element: (
      <AdminCLink model="features">
        <Features />
      </AdminCLink>
    ),
  });
  routesAdmin.push({
    path: 'features/:accountId',
    element: (
      <AdminCLink model="features">
        <DataContent tabs="features" contextType="admin" />
      </AdminCLink>
    ),
  });
}

const routerAdminConfig = [
  {
    path: '',
    reactRouter: true,
    routes: routesAdmin,
  },
];

const tokenDashboardLabel = `${i18next.t('tokens', { count: 1 })} ${i18next.t(
  'clink-dashboard-title',
)}`;
const supplyChainDashboard = {
  path: 'supply-chain-dashboard',
  element: (
    <AdminProsper contextType="adminProsper">
      <SupplyChainDashboardProsper />
    </AdminProsper>
  ),
  label: (
    <span data-testid="sidebar-item-supply-chain-dashboard">
      <DashboardIcon /> {i18next.t('clink-supply-chain-title')}{' '}
      {i18next.t('clink-dashboard-title')}
    </span>
  ),
};
const routerProsperConfig = [
  {
    path: `${BASE_URLS.ADMIN_PROSPER}`,
    reactRouter: true,
    routes: [
      {
        index: true,
        element: (
          <AdminProsper contextType="adminProsper">
            <DashboardProsper />
          </AdminProsper>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <AdminProsper contextType="adminProsper">
            <DashboardProsper />
          </AdminProsper>
        ),
        label: (
          <span data-testid="sidebar-item-prosper-dashboard">
            <DashboardIcon /> {tokenDashboardLabel}
          </span>
        ),
      },
      supplyChainDashboard,
      {
        path: 'accounts',
        label: (
          <span data-testid="sidebar-item-prosper-accounts">
            <ContractorsIcon /> {i18next.t('clink-accounts-title')}
          </span>
        ),
        element: (
          <AdminProsper model="accountsProsper">
            <Accounts />
          </AdminProsper>
        ),
      },
      {
        path: 'accounts/:accountId',
        element: (
          <AdminProsper>
            <DataContent tabs="adminProsper" contextType="adminProsper" />
          </AdminProsper>
        ),
      },
      {
        path: 'search',
        element: (
          <AdminProsper>
            <SearchResults contextType="adminProsper" />
          </AdminProsper>
        ),
      },
    ].filter((i) => Boolean(i)),
  },
];

routerProsperConfig[0].routes.push({
  path: 'supply_chain',
  label: (
    <span data-testid="sidebar-item-supply-chain">
      <ContractorsIcon /> {i18next.t('clink-supply-chain-title')}
    </span>
  ),
  element: (
    <AdminProsper model="accountsProsperSupplyChain">
      <Accounts customTypeAccount={EXTERNAL_SUBCONTRACTOR} />
    </AdminProsper>
  ),
});

export { routerAdminConfig, routerProsperConfig, EXTERNAL_SUBCONTRACTOR };
