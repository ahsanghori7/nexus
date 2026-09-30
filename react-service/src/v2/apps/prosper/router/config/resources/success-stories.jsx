import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import SuccessStories from 'v2/apps/prosper/pages/resources/SuccessStories';
import i18next from 'v2/helpers/i18n';

const config = {
  id: 17,
  path: 'success-stories',
  label: i18next.t('success-stories'),
  element: (
    <Prosper title={i18next.t('success-stories')}>
      <SuccessStories />
    </Prosper>
  ),
  filter: [],
  filterCountry: ['EU', 'NZ', 'AUS'],
  redirects: [],
};

export default config;
