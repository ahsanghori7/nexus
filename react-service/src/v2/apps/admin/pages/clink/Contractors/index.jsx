import React, { useState, useEffect } from 'react';
import Link from '@mui/material/Link';
import capitalize from 'lodash/capitalize';
import { Table, CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Actions from './Actions';

const { prosperBoxRed } = CONSTANTS.colors.prosper;

function Contractors(props) {
  const { users, subscription, dispatch, params } = props;
  const { list, listCount } = users;
  const { subscriptionsList } = subscription;
  const { t } = useTranslation();
  const context = useContext();
  const { actions, pages, config } = context;
  const { typeAccount } = config;
  const { users: contractorPage } = pages;
  const { actions: contractorsActions, columns, actionColumn } = contractorPage;
  const { config: columnAction } = actionColumn;

  const [paginationPage, setPaginationPage] = useState(0);
  const [paginationRowsPerPage, setPaginationRowsPerPage] = useState(20);

  useEffect(() => {
    const term = params && params.term ? params.term : '';
    dispatch(
      actions.fetchUsers({
        type: typeAccount,
        limit: 20,
        page: 0,
        offset: 0,
        order: 'registration-date',
        desc: 1,
        query: term,
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listWithActions =
    list && list.length
      ? list.map((user) => {
          return {
            ...user,
            company: (
              <Link
                href={`${BASE_URLS.APP_CLINK}/relay?action=account&method=switchGhostMode&redirect_user_id=${user.id}`}
                target="_blank"
                sx={{ color: prosperBoxRed, textDecoration: 'none' }}
                data-testid={`contractors-ghost-mode-link-${user.id}`}
              >
                {user.company}
              </Link>
            ),
            actions: (
              <Actions
                user={user}
                contractorsActions={contractorsActions}
                subscriptionsList={subscriptionsList}
                handleConfirm={(s) => {
                  dispatch(
                    actions.changeSubscription({
                      aid: user.account_id,
                      sid: s.id,
                    })
                  ).then(() => {
                    const newList = list.map((u) =>
                      Number(u.account_id) === Number(user.account_id)
                        ? {
                            ...u,
                            subscription: s.label,
                            subscription_id: s.id,
                            frequency: capitalize(s.interval_type),
                          }
                        : u
                    );
                    dispatch(actions.updateUsers(newList));
                  });
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
          actions.fetchUsers({
            type: typeAccount,
            offset: paginationPage * paginationRowsPerPage,
            limit: paginationRowsPerPage,
            page: paginationPage,
            order: field,
            desc: sortDesc ? 1 : 0,
            query: term,
          })
        );
      }}
      onPageChange={(pageSettings) => {
        const { rowsPerPage, page } = pageSettings;
        const term = params && params.term ? params.term : '';
        dispatch(
          actions.fetchUsers({
            type: typeAccount,
            offset: page * rowsPerPage,
            limit: rowsPerPage,
            page,
            query: term,
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
  users: state.users,
  subscription: state.subscription,
});

export default connect(mapStateToProps)(Contractors);
