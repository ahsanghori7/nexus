import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import Projects from 'v2/apps/prosper/pages/projects';
import i18next from 'v2/helpers/i18n';
import findOpt from './find-opportunities';
import viewProject from './page';
import unlocked from './unlocked';
import enquiries from './enquiries';
import submitQuote from './submit-quote';

const config = (sub) => {
  const findOptObj = findOpt(sub);
  return {
    id: 4,
    path: 'projects',
    element: (
      <Prosper title={i18next.t('clink-projects-title')}>
        <Projects />
      </Prosper>
    ),
    filter: [],
    filterCountry: [],
    label: i18next.t('clink-projects-title'),
    routes: [
      findOptObj.findOpportunities,
      viewProject,
      unlocked(sub),
      enquiries,
      ...submitQuote,
      findOptObj.opportunityWidget,
    ],
    redirects: [
      {
        path: '/projects',
        to: '/projects/find-opportunities',
      },
      {
        path: '/projects/enquiries/submit-quote',
        to: '/projects/enquiries',
      },
    ],
  };
};

export default config;
