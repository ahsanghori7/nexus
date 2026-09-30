import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import ViewProjectV3 from 'v2/apps/prosper/pages/projects/view-project-v3';
import Subscription from 'v2/helpers/user/subscription';

const subscriptionHelper = new Subscription();

const config = {
  path: ':projectId',
  element: (
    <Prosper title="OpportunitiesHeader" type="component">
      <ViewProjectV3 />
    </Prosper>
  ),
  filter: [subscriptionHelper.getActivatedSupplyChain()],
  filterCountry: [],
  redirects: [],
};

export default config;
