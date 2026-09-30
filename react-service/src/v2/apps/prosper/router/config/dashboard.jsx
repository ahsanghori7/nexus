import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import Dashboard from 'v2/apps/prosper/pages/dashboard';
import i18next from 'v2/helpers/i18n';
import Subscription from 'v2/helpers/user/subscription';

const subscriptionHelper = new Subscription();
const config = (sub) => {
  const redirects = subscriptionHelper.isNonTokenUser(sub.subscription_id)
    ? [
        {
          path: '/dashboard',
          to: '/projects/enquiries',
        },
      ]
    : [];
  return {
    id: 3,
    path: 'dashboard',
    element: (
      <Prosper title={i18next.t('clink-dashboard-title')}>
        <Dashboard />
      </Prosper>
    ),
    filter: [subscriptionHelper.getActivatedSupplyChain()],
    filterCountry: [],
    label: i18next.t('clink-dashboard-title'),
    redirects,
  };
};

export default config;
