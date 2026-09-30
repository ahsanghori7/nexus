import React, { useState, useEffect } from 'react';
import capitalize from 'lodash/capitalize';
import { Table } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Actions from './Actions';

function Accounts(props) {
  const { account, subscription, filters, dispatch, params } = props;
  const { list, listCount } = account;
  const { subscriptionsList } = subscription;
  const { list: filtersList } = filters;
  const { trades = [], regions = [] } = filtersList;
  const { t } = useTranslation();
  const context = useContext();
  const { actions, pages, config } = context;
  const { typeAccount } = config;
  const { accounts: accountsPage } = pages;
  const { actions: accountsActions, columns, actionColumn } = accountsPage;
  const { config: columnAction } = actionColumn;

  const [paginationPage, setPaginationPage] = useState(0);
  const [paginationRowsPerPage, setPaginationRowsPerPage] = useState(20);

  useEffect(() => {
    const term = params && params.term ? params.term : '';
    dispatch(
      actions.fetchAccounts({
        type: typeAccount,
        limit: 20,
        page: 0,
        offset: 0,
        order: 'status,registration-date',
        desc: '1,1',
        query: term,
        accounts: 1,
      })
    );

    // Fetch trades and regions for supply chain modal if not already loaded
    if (!trades.length || !regions.length) {
      dispatch(actions.fetchFilterOptions());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listWithActions =
    list?.length
      ? list.map((ac) => {
          return {
            ...ac,
            actions: (
              <Actions
                account={ac}
                accountsActions={accountsActions}
                subscriptionsList={subscriptionsList}
                trades={trades}
                locations={regions}
                dispatch={dispatch}
                actions={actions}
                changeSubscription={(s) => {
                  dispatch(
                    actions.changeSubscription({ aid: ac.id, sid: s.id })
                  ).then(() => {
                    const newList = list.map((a) =>
                      Number(a.id) === Number(ac.id)
                        ? {
                            ...a,
                            subscription: s.label,
                            subscription_id: s.id,
                            frequency: capitalize(s.interval_type),
                          }
                        : a
                    );
                    dispatch(actions.updateAccounts(newList));
                  });
                }}
                toggleStatus={() => {
                  dispatch(actions.toggleStatus(ac));
                }}
                updateFirstPQQSentProperty={() => {
                  dispatch(actions.toggleFirstPQQSend(ac));
                }}
              />
            ),
          };
        })
      : [];

  const formattedColumns =
    [...columns, { ...columnAction, label: t('table-column-actions') }].map(
      (column) => ({
        ...column,
        label: column.label || t(`users-table-column-${column.key}`),
      })
    ) || [];
  return (
    <Table
      columns={formattedColumns}
      rows={listWithActions}
      rowsCount={listCount}
      initRowsPerPage={paginationRowsPerPage}
      onChangeOrder={(field, sortDesc) => {
        const term = params && params.term ? params.term : '';
        dispatch(
          actions.fetchAccounts({
            type: typeAccount,
            offset: paginationPage * paginationRowsPerPage,
            limit: paginationRowsPerPage,
            page: paginationPage,
            order: field,
            desc: sortDesc ? 1 : 0,
            query: term,
            accounts: 1,
          })
        );
      }}
      onPageChange={(pageSettings) => {
        const { rowsPerPage, page } = pageSettings;
        const term = params && params.term ? params.term : '';
        dispatch(
          actions.fetchAccounts({
            type: typeAccount,
            offset: page * rowsPerPage,
            limit: rowsPerPage,
            page,
            query: term,
            accounts: 1,
          })
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
  account: state.account,
  subscription: state.subscription,
  filters: state.filters,
});

export default connect(mapStateToProps)(Accounts);
