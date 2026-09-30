import React, { useEffect } from 'react';
import { Table } from 'clink-components';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';

function CustomerHealthScore({ customerHealthScore, dispatch }) {
  const context = useContext();
  const { pages, actions } = context;
  const { customerHealthScore: customerHealthScorePage } = pages;
  const { columns } = customerHealthScorePage;
  const { list } = customerHealthScore;

  useEffect(() => {
    dispatch(actions.fetchHealthScore());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Table
      columns={columns}
      rows={list}
      pagination
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
    />
  );
}

const mapStateToProps = (state) => ({
  customerHealthScore: state.customerHealthScore,
});

export default connect(mapStateToProps)(CustomerHealthScore);
