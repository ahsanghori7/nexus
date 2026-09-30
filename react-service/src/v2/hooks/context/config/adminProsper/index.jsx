import React from 'react';
import { CONSTANTS, Image } from 'clink-components';
import { HeaderContent } from 'hooks/context/config/admin';
import accountsActions from './actions/accounts';
import accountsColumns from './columns/accounts';
import supplyChainColumns from './columns/supply_chain';
import actionColumn from '../common/actions';
import PanelHeaderContent from './PanelHeaderContent';

const { prosperLogoFull } = CONSTANTS.s3;
const accountsPageConfig = {
  actions: accountsActions,
  columns: accountsColumns,
  actionColumn: { config: actionColumn },
  path: 'accounts',
  keyTitle: 'clink-accounts-title',
};
const adminProsper = {
  pages: {
    home: { path: 'dashboard', keyTitle: 'clink-home-title' },
    dashboard: {
      path: 'dashboard',
      keyTitle: 'clink-dashboard-title',
    },
    accounts: accountsPageConfig,
    accountsProsper: accountsPageConfig,
    accountsProsperSupplyChain: {
      ...accountsPageConfig,
      columns: supplyChainColumns,
      path: 'supply_chain',
      keyTitle: 'clink-supply-chain-title',
    },
    prequalification: {
      PanelHeaderContent,
    },
    search: {
      acceptedModels: ['accountsProsper', 'accountsProsperSupplyChain'],
      actionColumn: { config: actionColumn },
      path: 'search',
      keyTitle: 'search-title',
    },
  },
  logo: <Image src={prosperLogoFull} />,
  headerContent: <HeaderContent first={false} />,
  config: {
    website: 2,
    typeAccount: 3,
  },
};

export default adminProsper;
