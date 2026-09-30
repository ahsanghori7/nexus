import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import HowItWorks from 'v2/apps/prosper/pages/resources/HowItWorks';
import i18next from 'v2/helpers/i18n';

const config = {
  id: 15,
  path: 'how-it-works',
  label: i18next.t('how-it-works'),
  element: (
    <Prosper title={i18next.t('how-it-works')}>
      <HowItWorks />
    </Prosper>
  ),
  filter: [],
  filterCountry: ['EU', 'NZ', 'AUS'],
  redirects: [],
};

export default config;
