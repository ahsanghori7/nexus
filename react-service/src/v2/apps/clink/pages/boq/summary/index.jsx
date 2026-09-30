import React from 'react';
import { connect } from 'react-redux';
import Table from 'v2/apps/shared/components/boq/Table';
import SummaryConfig, {
  Columns,
} from 'v2/apps/shared/components/boq/SummaryConfig';
import Box from '@mui/material/Box';
import Wrapper from 'v2/apps/clink/pages/boq/content/Wrapper';

const Summary = ({ boq, navigate = () => null }) => {
  const { entities } = boq;
  const entitiesArray = entities.map((e) => {
    const budget = e.entries.reduce((partialSum, rd) => {
      if (Number(rd.budget_total)) {
        return partialSum + Number(rd.budget_total);
      }
      return partialSum + Number(rd.budget_rate) * Number(rd.quantity);
    }, 0);
    return {
      id: e.label.replace(/ /g, '-').toLowerCase(),
      label: e.label,
      tid: e.tender_id,
      status: e.status,
      budget,
    };
  });

  // eslint-disable-next-line react/no-unstable-nested-components
  const WrapperSummary = (props) => (
    <SummaryConfig {...props} navigate={navigate} />
  );
  return (
    <Box>
      <Wrapper>
        <Table
          Columns={Columns}
          items={entitiesArray}
          Body={WrapperSummary}
          actions={false}
        />
      </Wrapper>
    </Box>
  );
};

const mapStateToProps = (state) => {
  return {
    boq: state.boq,
  };
};

export default connect(mapStateToProps)(Summary);
