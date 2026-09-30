import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment/moment';
import flag from 'v2/helpers/flags';
import WISTIA from 'v2/constants/wistia';
import EpochModal from './epoch-modal';
import StyledContainer from './content/Dashboard.styled';
import useConfig from './content/hooks';
import Layout from './content';

const LAYOUT = flag('PROSPER_DASHBOARD_LAYOUT') || 'columns';
const layoutsProps = { [LAYOUT]: true };
const Dashboard = ({ opportunities, enquiries, subcontractor, dispatch }) => {
  const config = useConfig(
    LAYOUT,
    opportunities,
    enquiries,
    subcontractor,
    dispatch,
  );

  let subDays = null;
  if (subcontractor && subcontractor.created_at) {
    const today = moment();
    const subRegDate = moment(subcontractor.created_at);
    subDays = today.diff(subRegDate, 'days');
  }

  return (
    <StyledContainer {...layoutsProps} data-test-id="dashboard-panels">
      <Layout config={config} />
      {WISTIA.WHAT_ARE_TOKENS_MODAL && (
        <EpochModal createdAtDate={subDays} subcontractor={subcontractor} />
      )}
    </StyledContainer>
  );
};

const mapStateToProps = (state) => {
  return {
    subcontractor: state.subcontractor,
    opportunities: state.opportunities,
    enquiries: state.enquiries,
  };
};

export default connect(mapStateToProps)(Dashboard);
