import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { renderHtmlInText } from 'v2/helpers/data';
import { getUrlWithoutParamers } from 'v2/helpers/url';
import { CONSTANTS } from 'clink-components';
import { StyledOpportunitiesHeader } from './Opportunities.styled';

import Settings from 'v2/apps/prosper/pages/projects/view-project-v3/packages/Settings';

const { blueMagentaViolet } = CONSTANTS.colors.general;

const OpportunitiesHeader = (props) => {
  const { opportunities, subcontractor, account, isTitle = true } = props;
  const { project: data, projects, status, statusProject } = opportunities;
  const { trades } = subcontractor;
  const { t } = useTranslation();
  const { account: clientData } = account;

  let nMatches = projects.flatMap((project) => {
    const { tenders } = project;
    return tenders.flatMap((tender) => {
      const { packages } = tender;
      const newPacks = packages.filter((p) => !isNaN(p));
      const packagesResult = newPacks.filter((check) =>
        Object.keys(trades).map(Number).includes(check)
      );
      return packagesResult.length ? tender : null;
    });
  });
  nMatches = nMatches.filter((match) => match);
  nMatches = nMatches.filter((tender) => !tender.registered || !tender.awarded);

  const label = nMatches.length === 1 ? 'interest-result' : 'interest-results';
  const matches = t(label, { count: nMatches.length });
  const isFindOpportunities =
    getUrlWithoutParamers().includes('find-opportunities');
  const companyName = (clientData && clientData.name) || null;

  const name = data ? data.project : companyName;
  return (
    <StyledOpportunitiesHeader
      data-cy="opportunities-header"
      className="project-header"
    >
      <div className="project-name">
        <h1>
          {isTitle && isFindOpportunities && t('opportunities')}
          {isTitle && !isFindOpportunities && name && (
            <span style={{ color: blueMagentaViolet }}>{name}</span>
          )}
        </h1>
      </div>
      {!status &&
        !statusProject &&
        isFindOpportunities &&
        projects &&
        !isTitle && <Settings text={renderHtmlInText(matches)} />}
    </StyledOpportunitiesHeader>
  );
};

const mapStateToProps = (state) => {
  return {
    opportunities: state.opportunities,
    subcontractor: state.subcontractor,
    account: state.account,
  };
};

export default connect(mapStateToProps)(OpportunitiesHeader);
