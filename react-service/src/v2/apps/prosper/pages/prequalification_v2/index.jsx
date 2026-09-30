import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { parseFloatVal } from 'v2/helpers/currency';
import { useContext } from 'hooks/context';
import { useTranslation } from 'react-i18next';
import Badge from '@mui/material/Badge';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import { expiredDate } from 'v2/helpers/date';
import Tabs from 'v2/apps/shared/components/tabs';
import Documents from 'v2/apps/shared/components/prequalification/v2/documents_v2';
import References from 'v2/apps/shared/components/prequalification/v2/references';
import Finance from 'v2/apps/shared/components/prequalification/v2/finance';
import Organization from 'v2/apps/shared/components/prequalification/v2/organization';
import { ProgressBar } from 'v2/apps/shared/components/company-v2/Mui.styled';

const { red } = CONSTANTS.colors.general;

const Prequalification = ({
  contextType = 'prosper',
  prequalification,
  subcontractor,
  dispatch,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const theme = useTheme();
  const smallDeviceResolution = useMediaQuery(theme.breakpoints.down('md'));

  const {
    percentage,
    documents,
    turnover,
    company_information,
    insurances,
    accreditation,
    ['custom-certificate']: customCertificate,
    ['management-system']: managementSystem,
  } = prequalification;

  const aid = subcontractor?.info?.account_id;

  const isProsper = contextType === 'prosper';
  useEffect(() => {
    if (isProsper && aid) {
      dispatch(actions.fetchPrequalificationSections());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProsper, subcontractor?.id]);

  useEffect(() => {
    if (isProsper && documents && Object.keys(documents).length) {
      dispatch(actions.fetchPrequalification_V2(aid));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProsper, documents]);

  const commonProps = { aid, contextType };

  const { max_order_value, min_order_value } = company_information;

  const turnoverNotInitialized = turnover.filter((turn) => !turn.inizialized);
  const formCompleted =
    turnoverNotInitialized.length &&
    parseFloatVal(max_order_value) &&
    parseFloatVal(min_order_value);

  const showNotificationDoc = Boolean(
    [
      ...(insurances || []),
      ...(accreditation || []),
      ...(customCertificate || []),
      ...(managementSystem || []),
    ].filter((i) => expiredDate(new Date(i.date))).length,
  );
  // eslint-disable-next-line react/no-unstable-nested-components
  const PreqDocs = ({ children }) =>
    showNotificationDoc ? (
      <Badge
        variant="dot"
        sx={{ '& > span': { backgroundColor: red, right: -6 } }}
      >
        {children}
      </Badge>
    ) : (
      children
    );

  const changeCompanyData = (value, section) => {
    let val = value;
    if (
      ['num_current_contractors', 'num_current_employees'].includes(section)
    ) {
      val = value === '0' ? '' : value;
    }
    return dispatch(actions.changeLocalCompanyInfo_V2({ value: val, section }));
  };

  const countryCode =
    subcontractor && subcontractor.country && subcontractor.country.code;
  const tabs = [
    {
      id: 1,
      title: t('finance'),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <Finance
          {...commonProps}
          {...props}
          contextType={contextType}
          changeCompanyData={changeCompanyData}
        />
      ),
    },
    {
      id: 2,
      title: t('organization'),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <Organization {...commonProps} {...props} contextType={contextType} />
      ),
    },
    {
      id: 3,
      title: <PreqDocs>{t('documents')}</PreqDocs>,
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <Documents {...commonProps} {...props} contextType={contextType} />
      ),
    },
    {
      id: 4,
      title: t('references'),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <References {...commonProps} {...props} contextType={contextType} />
      ),
    },
  ];

  const percentComplete =
    percentage.finance + percentage.documents + percentage.references;

  return (
    Boolean(prequalification) && (
      <>
        {smallDeviceResolution && (
          <ProgressBar percentComplete={percentComplete} />
        )}
        <Tabs
          tabs={tabs}
          block={!formCompleted}
          hideActionButtonsInTabs={[0]}
          percentComplete={percentComplete}
          showPercent
          countryCode={countryCode}
          contextType={contextType}
        />
      </>
    )
  );
};

const mapStateToProps = (state) => ({
  prequalification: state.prequalificationV2,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(Prequalification);
