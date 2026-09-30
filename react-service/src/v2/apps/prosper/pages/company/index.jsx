import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { useTranslation } from 'react-i18next';
import Tabs from 'v2/apps/shared/components/tabs';
import UserDetails from 'v2/apps/shared/components/company-v2/user-details';
import CompanyDetails from 'v2/apps/shared/components/company-v2/company-details';
import TradesLocations from 'v2/apps/shared/components/company-v2/trades-locations';
import ProfileCompleteUpdate from './ProfileCompleteUpdate';
import Loading from 'v2/apps/shared/components/Loading';

const CompanyProfile = ({
  contextType = 'prosper',
  subcontractor,
  company,
  dispatch,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const {
    accountId: id,
    status: subStatus,
    statusActions: subStatusActions,
  } = subcontractor;
  const { details, offering, status, statusActions } = company;
  const { regions, trades, types } = offering;

  const [completed, setCompleted] = useState(false);
  const [tabSelected, setTabSelected] = useState(0);

  const aid =
    subcontractor && subcontractor.info && subcontractor.info.account_id;

  useEffect(() => {
    dispatch(actions.resetFilter());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(actions.fetchCompany({ id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const commonProps = { aid, contextType };

  const handleOnSubmitUserDetails = (data) => {
    const updatedData = { ...data };
    delete updatedData['profile-image'];
    dispatch(actions.updateSubcontractorDescription({ data, id }));
  };

  const handleOnSubmitCompanyDetails = (data) => {
    const updatedData = { ...data };
    delete updatedData['company-logo'];

    dispatch(actions.updateProfile({ data, id })).then(() =>
      dispatch(actions.updateCompanyDetails(updatedData)),
    );
  };

  const handleOnSubmitTradesLocations = (data) => {
    dispatch(actions.updateOffering({ data, id }));
  };

  const lastStepFunction = () => {
    const offeringsCompleted =
      regions &&
      regions.length &&
      trades &&
      trades.length &&
      types &&
      types.length;
    if (offeringsCompleted) {
      setCompleted(true);
    }
  };

  const countryCode =
    subcontractor && subcontractor.country && subcontractor.country.code;

  const tabs = [
    {
      id: 1,
      title: t('profile-user-details'),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <UserDetails
          {...commonProps}
          {...props}
          id={id}
          contextType={contextType}
          data={subcontractor}
          theme="prosper"
          handleUpdate={handleOnSubmitUserDetails}
          setTabSelected={setTabSelected}
        />
      ),
    },
    {
      id: 2,
      title: t('profile-company-details'),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <CompanyDetails
          {...commonProps}
          {...props}
          id={id}
          contextType={contextType}
          data={details}
          handleUpdate={handleOnSubmitCompanyDetails}
          setTabSelected={setTabSelected}
        />
      ),
    },
    {
      id: 3,
      title: t('trades-and-locations'),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <TradesLocations
          {...commonProps}
          {...props}
          id={id}
          contextType={contextType}
          data={offering}
          handleOnSubmit={handleOnSubmitTradesLocations}
          setTabSelected={setTabSelected}
        />
      ),
    },
  ];

  return (
    <>
      {subStatus.message ||
      status.message ||
      subStatusActions.message ||
      statusActions.message ? (
        <Loading
          status={
            subStatus.message ||
            status.message ||
            subStatusActions.message ||
            statusActions.message
          }
        />
      ) : (
        <Tabs
          tabs={tabs}
          lastStepSave
          setPageFromExternal={setTabSelected}
          pageFromExternal={tabSelected}
          hideActionButtonsInTabs={[0, 1]}
          lastStepFunction={lastStepFunction}
          countryCode={countryCode}
        />
      )}
      {completed && <ProfileCompleteUpdate />}
    </>
  );
};

const mapStateToProps = (state) => ({
  subcontractor: state.subcontractor,
  company: state.company,
});

export default connect(mapStateToProps)(CompanyProfile);
