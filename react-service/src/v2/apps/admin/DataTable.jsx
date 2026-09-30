import React, { useEffect } from 'react';
import { Table } from 'clink-components';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Loading from 'v2/apps/shared/components/Loading';
import Box from '@mui/material/Box';

const DataTable = (props) => {
  const {
    id,
    contextType,
    dataType,
    dispatch,
    [dataType]: dataState,
    table = '',
  } = props;
  const type = table ? `${dataType}_${table}` : dataType;
  const { list, status } = dataState;
  const context = useContext(contextType);
  const { actions, account } = context;
  const { [type]: columns } = account;

  useEffect(() => {
    switch (dataType) {
      case 'activity':
        dispatch(actions.fetchActivities(id));
        break;
      case 'opportunities':
        dispatch(actions.fetchOpportunitiesByAccount(id));
        break;
      case 'engagement':
        dispatch(actions.fetchEngagement({ aid: id, typeData: table }));
        break;
      case 'supply_chain':
        dispatch(actions.fetchAdminSupplyChain(id));
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box pt={6} data-testid="admin-datatable">
      {status.message ? (
        <Loading status={status.message} />
      ) : (
        <Table
          columns={columns}
          rows={list}
          pagination
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </Box>
  );
};

const mapStateToProps = (state) => ({
  opportunities: state.opportunities,
  activity: state.activity,
  user: state.user,
  engagement: state.engagement,
  supply_chain: state.supply_chain,
});

export default connect(mapStateToProps)(DataTable);
