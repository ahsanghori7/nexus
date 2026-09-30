import React from 'react';
import i18next from 'v2/helpers/i18n';
import { getQueryStringVars } from 'v2/helpers/url';
import SupplyChain from 'v2/apps/clink/pages/supply-chain-profile';
import Layout, { PROJECT_BREADCRUMBS, WITH_PROJECT } from 'v2/apps/clink/layout';

const SPWrapper = () => {
  const vars = getQueryStringVars();
  const { slug } = vars;

  let breadCrumbItems = [
    {
      label: i18next.t('supply-chain'),
      name: i18next.t('supply-chain'),
      href: '/main-contractor/supply_chain',
    },
  ];
  if (slug) {
    breadCrumbItems = [
      ...PROJECT_BREADCRUMBS,
      {
        ...WITH_PROJECT,
        rest: 'procurement_schedule',
        name: i18next.t('procurement-schedule'),
        label: i18next.t('procurement-schedule'),
      },
    ];
  }

  return (
    <Layout
      breadCrumbItems={breadCrumbItems}
      title={i18next.t('supply-chain')}
      companyName
    >
      <SupplyChain />
    </Layout>
  );
};

const routerConfig = {
  path: 'supply_chain/:id',
  element: <SPWrapper />,
};

export default routerConfig;
