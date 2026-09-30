import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import Projects from 'v2/apps/prosper/pages/projects';
import OptViewer from 'v2/apps/prosper/pages/projects/opt-viewer';
import i18next from 'v2/helpers/i18n';
import Subscription from 'v2/helpers/user/subscription';

const subscriptionHelper = new Subscription();

const findOpportunitiesConfig = {
  element: (
    <Prosper title="OpportunitiesHeader" type="component">
      <Projects />
    </Prosper>
  ),
  filter: [subscriptionHelper.getActivatedSupplyChain()],
  filterCountry: ['EU'],
  redirects: [],
};
const opportunityWidgetConfig = {
  element: (
    <Prosper title={i18next.t('opportunities')}>
      <OptViewer />
    </Prosper>
  ),
  filter: [subscriptionHelper.getActivatedSupplyChain()],
  filterCountry: ['EU'],
  redirects: [],
};

const config = (subcontractor) => {
  const { regions, trades } = subcontractor;
  const hasNoSettings =
    !Object.values(trades).length || !Object.values(regions).length;
  const findOpportunities = {
    id: 5,
    path: 'find-opportunities',
    label: i18next.t('find-opportunities'),
    ...(subcontractor.id && hasNoSettings
      ? opportunityWidgetConfig
      : findOpportunitiesConfig),
  };
  const opportunityWidget = {
    id: 18,
    path: 'opportunity-viewer',
    ...opportunityWidgetConfig,
  };

  return {
    findOpportunities,
    opportunityWidget,
  };
};

export default config;
