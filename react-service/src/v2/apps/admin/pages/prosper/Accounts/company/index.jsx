import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Loading from 'v2/apps/shared/components/Loading';
import UserDetails from './user-description';
import CompanyDetails from './details';
import CompanyDescription from './description';
import CompanyOffering from './offering';
import {
  StyledPegasusContainer,
  StyledProsperContainer,
  StyledFull,
  StyledFullProsper,
  StyledPegasusColumn,
  StyledProsperColumn,
} from './Theme.styled';

const CompanyProfile = ({
  id,
  contextType,
  company,
  dispatch,
  subcontractor,
}) => {
  const [loading, setLoading] = useState(false);
  const context = useContext(contextType);
  const { actions } = context;
  const { details, offering, description, status, statusActions } = company;

  useEffect(() => {
    if (id) {
      dispatch(actions.fetchCompany({ id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOnSubmit = (data) => {
    setLoading(true);
    dispatch(actions.updateProfile({ data, id })).then(() => setLoading(false));
  };

  const handleOnSubmitOffering = (data) => {
    setLoading(true);
    dispatch(actions.updateOffering({ data, id })).then(() =>
      setLoading(false)
    );
  };

  const handleOnSelect = (data, typeData) =>
    dispatch(actions.selectOption({ data, typeData }));

  const handleOnSubmitDetails = (data) => {
    setLoading(true);

    dispatch(actions.updateSubcontractorDescription({ data, id })).then(() =>
      setLoading(false)
    );
  };

  let content = null;
  if (contextType === 'adminProsper') {
    content = (
      <StyledPegasusContainer className="pegasus-company-profile">
        <CompanyDetails
          contextType={contextType}
          data={details}
          handleUpdate={handleOnSubmit}
          loading={loading}
        />
        <StyledPegasusColumn className="pegasus-company-profile__column">
          <CompanyOffering
            id={id}
            contextType={contextType}
            data={offering}
            selectOption={handleOnSelect}
            handleOnSubmit={handleOnSubmitOffering}
            loading={loading}
          />
        </StyledPegasusColumn>
        <StyledPegasusColumn className="pegasus-company-profile__column">
          <CompanyDescription
            contextType={contextType}
            data={description}
            handleUpdate={handleOnSubmit}
            loading={loading}
          />
        </StyledPegasusColumn>
      </StyledPegasusContainer>
    );
  } else if (contextType === 'prosper') {
    content = (
      <StyledProsperContainer className="prosper-company-profile">
        <StyledFull>
          <UserDetails
            id={id}
            contextType={contextType}
            data={subcontractor}
            cssClass="profile-cover"
            theme="prosper"
            handleUpdate={handleOnSubmitDetails}
            loading={loading}
          />
        </StyledFull>
        <StyledProsperColumn className="prosper-company-profile__column">
          {!status.message && (
            <CompanyDetails
              contextType={contextType}
              data={details}
              handleUpdate={handleOnSubmit}
              loading={loading}
            />
          )}
        </StyledProsperColumn>
        <StyledProsperColumn className="prosper-company-profile__column">
          {!status.message && (
            <CompanyDescription
              contextType={contextType}
              data={description}
              handleUpdate={handleOnSubmit}
              loading={loading}
            />
          )}
        </StyledProsperColumn>
        <StyledFullProsper className="prosper-company-profile__full">
          {!status.message && (
            <CompanyOffering
              id={id}
              contextType={contextType}
              data={offering}
              selectOption={handleOnSelect}
              handleOnSubmit={handleOnSubmitOffering}
              loading={loading}
            />
          )}
        </StyledFullProsper>
      </StyledProsperContainer>
    );
  }

  return (
    <>
      <Loading status={statusActions.message} />
      <Loading status={status.message} />
      {!status.message && content}
    </>
  );
};

const mapStateToProps = (state) => ({
  company: state.company,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(CompanyProfile);
