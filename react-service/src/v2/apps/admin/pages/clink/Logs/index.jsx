import React, { useState, useEffect } from 'react';
import { Table } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';

function Logs(props) {
  const { logs, dispatch, params } = props;
  const { list, listCount } = logs;
  const { t } = useTranslation();
  const context = useContext();
  const { actions, pages } = context;
  const { logs: logsPage } = pages;
  const { columns } = logsPage;

  const [paginationPage, setPaginationPage] = useState(0);
  const [paginationRowsPerPage, setPaginationRowsPerPage] = useState(20);

  useEffect(() => {
    const term = params && params.term ? params.term : '';
    dispatch(
      actions.fetchLogs({
        limit: 20,
        page: 0,
        offset: 0,
        order: 'action_date',
        desc: 1,
        query: term,
      }),
    );
  }, [dispatch, actions, params]);
  const listWithActions = list?.length
    ? list.map((ac) => {
        return {
          ...ac,
        };
      })
    : [];

  const formattedColumns =
    [...columns].map((column) => ({
      ...column,
      label: column.label || t(`logs-table-column-${column.key}`),
    })) || [];
  return (
    <Table
      columns={formattedColumns}
      rows={listWithActions}
      rowsCount={listCount}
      initRowsPerPage={paginationRowsPerPage}
      onChangeOrder={(field, sortDesc) => {
        const term = params && params.term ? params.term : '';
        dispatch(
          actions.fetchLogs({
            offset: paginationPage * paginationRowsPerPage,
            limit: paginationRowsPerPage,
            order: field,
            desc: sortDesc ? 1 : 0,
            page: paginationPage,
            query: term,
          }),
        );
      }}
      onPageChange={(pageSettings) => {
        const { rowsPerPage, page } = pageSettings;
        const term = params && params.term ? params.term : '';
        dispatch(
          actions.fetchLogs({
            offset: page * rowsPerPage,
            limit: rowsPerPage,
            page,
            query: term,
          }),
        );
        setPaginationRowsPerPage(rowsPerPage);
        setPaginationPage(page);
      }}
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
      pagination
    />
  );
}

const mapStateToProps = (state) => ({
  logs: state.logs,
});

export default connect(mapStateToProps)(Logs);
