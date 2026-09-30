import React from 'react';
import Tokens from 'v2/apps/prosper/pages/resources/WhatAreTokens';
import Prosper from 'v2/apps/prosper/pages';
import i18next from 'v2/helpers/i18n';
import Subscription from 'v2/helpers/user/subscription';

const subscriptionHelper = new Subscription();

const config = {
  id: 16,
  path: 'tokens',
  label: i18next.t('what-are-tokens'),
  element: (
    <Prosper title={i18next.t('tokens', { count: 2 })}>
      <Tokens />
    </Prosper>
  ),
  filter: subscriptionHelper.getNonTokenUsers(),
  filterCountry: ['EU', 'NZ', 'AUS'],
  redirects: [],
};

export default config;
