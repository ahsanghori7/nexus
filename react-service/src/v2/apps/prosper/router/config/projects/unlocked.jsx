import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import RegisteredInterests from 'v2/apps/prosper/pages/projects/registered-interests';
import i18next from 'v2/helpers/i18n';
import Subscription from 'v2/helpers/user/subscription';

const subscriptionHelper = new Subscription();
const UNLOCKED = 'unlocked-projects';
const REGISTERED_INTERESTS = 'registered-interests';
const resource = 'interests';

const config = (subcontractor) => {
  let unlocked = REGISTERED_INTERESTS;
  let version = 'v1';
  let method = 'latest';
  if (!subscriptionHelper.isNonTokenUser(subcontractor.subscription_id)) {
    unlocked = UNLOCKED;
    method = 'unlocked_projects';
    version = 'v2';
  }
  return {
    id: 6,
    path: unlocked,
    element: (
      <Prosper title={i18next.t(unlocked)}>
        <RegisteredInterests
          resource={resource}
          method={method}
          version={version}
        />
      </Prosper>
    ),
    filter: [subscriptionHelper.getActivatedSupplyChain()],
    label: i18next.t(unlocked),
    redirects: [],
    filterCountry: ['EU'],
  };
};

export default config;
