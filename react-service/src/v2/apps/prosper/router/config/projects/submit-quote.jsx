import React from 'react';
import { useSelector } from 'react-redux';
import Prosper from 'v2/apps/prosper/pages';
import SubmitQuote from 'v2/apps/prosper/pages/submit-quote';
import i18next from 'v2/helpers/i18n';

const SubmitQuoteTitle = ({ titleKey, contextType = 'prosper' }) => {
  const boq = useSelector((state) => state.boq);
  const { loading, entity } = boq;
  const label = entity && entity.tender && entity.tender.label;
  const title = `${i18next.t(titleKey)} - ${label}`;

  return (
    <Prosper
      contextType={contextType}
      title={loading && loading.message ? null : title}
    >
      <SubmitQuote />
    </Prosper>
  );
};

const SUBMIT_QUOTE_TITLE = 'submit-quote';
const SUBMIT_QUOTE_PAGE_TITLE = 'digital-price-breakdown';

const config = [
  {
    id: 28,
    path: `enquiries/${SUBMIT_QUOTE_TITLE}/:slug`,
    element: (
      <Prosper title={`${i18next.t(SUBMIT_QUOTE_TITLE)}`}>
        <SubmitQuote contextType="prosper" />
      </Prosper>
    ),
    filter: [],
    filterCountry: [],
    redirects: [],
  },
  {
    id: 29,
    path: `enquiries/${SUBMIT_QUOTE_TITLE}/:slug/:tid`,
    element: (
      <SubmitQuoteTitle
        contextType="prosper"
        titleKey={SUBMIT_QUOTE_PAGE_TITLE}
      />
    ),
    filter: [],
    filterCountry: [],
    redirects: [],
  },
];

export default config;
