import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import truncate from 'lodash/truncate';
import ProsperDashboardCard from 'v2/apps/shared/components/cards/prosper/DashboardCard';
import Bar from './charts/bar';
import DateRange from './charts/DateRange';
import {
  MuiDashboardCardContainer,
  MuiCompanyCardContainer,
} from './Mui.styled';
import CompanyCard from './CompanyCard';

const sixWeeks = 42;
const d = new Date();
const sixWeeksAgo = new Date(d.setDate(d.getDate() - sixWeeks));
const today = new Date();
const truncateOptions = {
  length: 10,
  omission: '',
};
const Dashboard = ({ analytics, dispatch }) => {
  const [issuedStart, setIssuedStart] = useState(sixWeeksAgo);
  const [issuedEnd, setIssuedEnd] = useState(today);
  const [freeStart, setFreeStart] = useState(sixWeeksAgo);
  const [freeEnd, setFreeEnd] = useState(today);
  const context = useContext();
  const { actions } = context;

  useEffect(() => {
    const query1 = {
      type: 'issued',
      start_date: truncate(issuedStart.toISOString(), truncateOptions),
      end_date: truncate(issuedEnd.toISOString(), truncateOptions),
      token_type: 'paid',
      interval: 'week',
    };
    dispatch(actions.fetchTokens(query1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuedStart, issuedEnd]);

  useEffect(() => {
    const query2 = {
      type: 'issued',
      start_date: truncate(issuedStart.toISOString(), truncateOptions),
      end_date: truncate(issuedEnd.toISOString(), truncateOptions),
      token_type: 'paid',
      interval: 'day',
    };
    dispatch(actions.fetchTokens(query2));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuedStart, issuedEnd]);

  useEffect(() => {
    const query3 = {
      type: 'used',
      start_date: truncate(freeStart.toISOString(), truncateOptions),
      end_date: truncate(freeEnd.toISOString(), truncateOptions),
      token_type: 'free',
      interval: 'week',
    };
    dispatch(actions.fetchTokens(query3));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeStart, freeEnd]);

  useEffect(() => {
    const query4 = {
      type: 'used',
      start_date: truncate(freeStart.toISOString(), truncateOptions),
      end_date: truncate(freeEnd.toISOString(), truncateOptions),
      token_type: 'free',
      interval: 'day',
    };
    dispatch(actions.fetchTokens(query4));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeStart, freeEnd]);

  const { issuedpaidweek, issuedpaidday, usedfreeday, usedfreeweek } =
    analytics;

  return (
    <MuiDashboardCardContainer>
      <ProsperDashboardCard
        title="Token purchased"
        optionalRightContent={
          <DateRange
            start={issuedStart}
            end={issuedEnd}
            handleStart={setIssuedStart}
            handleEnd={setIssuedEnd}
          />
        }
      >
        <Bar data={issuedpaidweek} />
      </ProsperDashboardCard>
      <ProsperDashboardCard title="Purchased Tokens per user">
        <MuiCompanyCardContainer>
          {issuedpaidday.map((elem) => (
            <CompanyCard key={elem.id} elem={elem} />
          ))}
        </MuiCompanyCardContainer>
      </ProsperDashboardCard>
      <ProsperDashboardCard
        title="Free tokens per week"
        optionalRightContent={
          <DateRange
            start={freeStart}
            end={freeEnd}
            handleStart={setFreeStart}
            handleEnd={setFreeEnd}
          />
        }
      >
        <Bar data={usedfreeweek} />
      </ProsperDashboardCard>
      <ProsperDashboardCard title="Free Token usage per user">
        <MuiCompanyCardContainer>
          {usedfreeday.map((elem) => (
            <CompanyCard key={elem.id} elem={elem} />
          ))}
        </MuiCompanyCardContainer>
      </ProsperDashboardCard>
    </MuiDashboardCardContainer>
  );
};

const mapStateToProps = (state) => ({
  analytics: state.analytics,
});

export default connect(mapStateToProps)(Dashboard);
