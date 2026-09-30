import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import ProsperDashboardCard from 'v2/apps/shared/components/cards/prosper/DashboardCard';
import Doughnut from './charts/doughnut';
import truncate from 'lodash/truncate';
import DateRange from './charts/DateRange';
import { MuiDashboardCardContainer } from './Mui.styled';

// Beginning of supply chain invitation date
const startDate = new Date('2022/10/01');
const today = new Date();
const truncateOptions = {
  length: 10,
  omission: '',
};
const SupplyChainDashboard = ({ analytics, dispatch }) => {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(today);
  const context = useContext();
  const { actions } = context;

  useEffect(() => {
    const query1 = {
      type: 'supply_chain',
      start_date: truncate(start.toISOString(), truncateOptions),
      end_date: truncate(end.toISOString(), truncateOptions),
    };
    dispatch(actions.fetchSupplyChainAnalytics(query1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  return (
    <MuiDashboardCardContainer supplyChain>
      <ProsperDashboardCard
        title="Activated %"
        optionalRightContent={
          <DateRange
            start={start}
            end={end}
            handleStart={setStart}
            handleEnd={setEnd}
          />
        }
      >
        <Doughnut data={analytics.supplyChain} />
      </ProsperDashboardCard>
    </MuiDashboardCardContainer>
  );
};

const mapStateToProps = (state) => ({
  analytics: state.analytics,
});

export default connect(mapStateToProps)(SupplyChainDashboard);
