import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import HowItWorks from 'v2/apps/prosper/pages/resources/HowItWorks';
import i18next from 'v2/helpers/i18n';
import howItWorks from './how-it-works';
import successStories from './success-stories';
import whatAreTokens from './what-are-tokens';

const config = {
  id: 14,
  path: 'resources',
  element: (
    <Prosper title={i18next.t('how-it-works')}>
      <HowItWorks />
    </Prosper>
  ),
  filter: [],
  filterCountry: ['EU', 'NZ', 'AUS'],
  label: i18next.t('resources'),
  routes: [howItWorks, successStories, whatAreTokens],
  redirects: [],
};

export default config;
