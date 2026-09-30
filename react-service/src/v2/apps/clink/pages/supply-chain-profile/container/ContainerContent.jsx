import React from 'react';
import { SECTIONS } from 'v2/helpers/prequal/documents';
import { CONSTANTS } from 'clink-components';
import { MuiPanel } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import MuiCompanyDetails from 'v2/apps/clink/pages/supply-chain-profile/CompanyDetailsForm';
import PreqDocsAndRefs from 'v2/apps/clink/pages/supply-chain-profile/prequalification/PreqDocsAndRefs';
import CompanyOfferingForm from 'v2/apps/clink/pages/supply-chain-profile/tab-forms/CompanyOfferingForm';
import QualityAndExample from 'v2/apps/clink/pages/supply-chain-profile/prequalification/QualityAndExample';
import flag from 'v2/helpers/flags';
import HealthSafetyAndEnvironmental from 'v2/apps/clink/pages/supply-chain-profile/prequalification/health-safety-and-environmental/HealthSafetyAndEnvContainer';

const { clinkBackgroundPurple } = CONSTANTS.colors.general;
const { proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

const ContainerContent = ({
  aid,
  contextType = 'clink',
  prequalification = {},
  company = {},
}) => {
  const { details, logos, offering } = company;
  const {
    [SECTIONS.TUR]: turnover,
    [SECTIONS.INF]: company_information,
    [SECTIONS.ORG]: organisation,
  } = prequalification;
  return (
    <>
      <MuiPanel
        sx={{
          fontFamily: `${proxima_nova1}, ${proxima_nova2}`,
        }}
      >
        <MuiCompanyDetails
          logos={logos}
          details={details}
          members={organisation}
        />
        <CompanyOfferingForm
          colorTheme={clinkBackgroundPurple}
          nested
          offering={offering}
          turnover={turnover}
          companyInformation={company_information}
        />
      </MuiPanel>
      <PreqDocsAndRefs accordion nested aid={aid} contextType={contextType} />
      {flag('CLINK_PREQUAL_UPDATES') && (
        <>
          <HealthSafetyAndEnvironmental
            accordion
            nested
            aid={aid}
            contextType={contextType}
          />
          <QualityAndExample
            accordion
            nested
            aid={aid}
            contextType={contextType}
          />
        </>
      )}
    </>
  );
};

export default ContainerContent;
