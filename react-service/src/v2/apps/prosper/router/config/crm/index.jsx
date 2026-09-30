import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import CompanyProfile from 'v2/apps/prosper/pages/company-profile';

const companyProfileConfig = {
  element: (
    <Prosper title="OpportunitiesHeader" type="component">
      <CompanyProfile />
    </Prosper>
  ),
  filter: [],
  filterCountry: [],
};

const config = {
  id: 20,
  path: 'company_profile',
  routes: [
    {
      id: 21,
      path: ':companyId',
      ...companyProfileConfig,
    },
    {
      id: 22,
      path: ':companyId/:contactId',
      ...companyProfileConfig,
    },
  ],
  redirects: [
    {
      path: '/company_profile',
      to: '/projects/enquiries',
    },
  ],
};

export default config;
