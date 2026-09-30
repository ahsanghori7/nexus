import React from 'react';
import i18next from 'v2/helpers/i18n';
import { getProjectLogo } from 'v2/helpers/url';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import OpportunityCard from 'v2/apps/shared/components/cards/small/OpportunityCard';

const CompanyCard = ({ elem }) => (
  <OpportunityCard
    theme="prosper-analytics-card"
    item={{
      projectImage: getProjectLogo(elem.projectId),
      projectName: elem.project,
      projectCompany: elem.company,
      projectName2: elem.projectName2,
      projectPack: elem.pack,
      projectDate: elem.date,
      tokenAmount: elem.tokenAmount,
      tokenCost:
        elem.cost &&
        parseCurrency(elem.cost, currencyConfig[i18next.t('currency')]),
    }}
  />
);

export default CompanyCard;
