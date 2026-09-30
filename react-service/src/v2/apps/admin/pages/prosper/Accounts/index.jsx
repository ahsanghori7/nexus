import React, { useEffect, useState } from 'react';
import capitalize from 'lodash/capitalize';
import { Table } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { Link as ReactLink } from 'react-router-dom';
import Actions from './Actions';

function Accounts(props) {
  const { users, subscription, filters, dispatch, params, customTypeAccount } =
    props;
  const { list, listCount } = users;
  const { subscriptionsList } = subscription;
  const { t } = useTranslation();
  const context = useContext('adminProsper');
  const { actions, pages, config } = context;
  const { typeAccount: specialistAccount, website } = config;
  const {
    accounts: accountsPage,
    accountsProsperSupplyChain: accountsProsperSupplyChainPage,
  } = pages;
  const { actions: accountsActions, columns, actionColumn } = accountsPage;
  const { columns: supplyChainColumns } = accountsProsperSupplyChainPage;
  const { config: columnAction } = actionColumn;
  const [paginationPage, setPaginationPage] = useState(0);
  const [paginationRowsPerPage, setPaginationRowsPerPage] = useState(20);
  const { list: optionFilters } = filters;
  const { regions: regionOptions } = optionFilters;

  const typeAccount = customTypeAccount || specialistAccount;
  const init = (
    ty = typeAccount,
    l = 20,
    p = 0,
    of = 0,
    o = 'registration-date',
    d = 1,
  ) => {
    const term = params && params.term ? params.term : '';
    dispatch(
      actions.fetchUsers({
        type: ty,
        limit: l,
        page: p,
        offset: of,
        order: o,
        desc: d,
        query: term,
        ...params,
      }),
    );
  };

  useEffect(() => {
    dispatch(actions.fetchSubscriptions({ website }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeAccount]);

  const listWithActions =
    list && list.length
      ? list.map((user) => {
          return {
            ...user,
            company: (
              <ReactLink
                to={`${BASE_URLS.ADMIN_PROSPER}/accounts/${user.account_id}`}
              >
                {user.company}
              </ReactLink>
            ),
            actions: (
              <Actions
                user={user}
                accountsActions={accountsActions}
                subscriptionsList={subscriptionsList}
                regionOptions={regionOptions ?? []}
                handleConfirm={(s, extraData) => {
                  dispatch(
                    actions.changeSubscription({
                      aid: user.account_id,
                      sid: s.id,
                      extraData,
                    }),
                  ).then(() => {
                    const newList = list.map((u) =>
                      Number(u.account_id) === Number(user.account_id)
                        ? {
                            ...u,
                            subscription: s.label,
                            subscription_id: s.id,
                            frequency: capitalize(s.interval_type),
                          }
                        : u,
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
    [
      ...(customTypeAccount ? supplyChainColumns : columns),
      { ...columnAction, label: t('table-column-actions') },
    ].map((column) => ({
      ...column,
      label: column.label || t(`users-table-column-${column.key}`),
    })) || [];
  return (
    <Table
      columns={formattedColumns}
      rows={listWithActions}
      rowsCount={listCount}
      initRowsPerPage={paginationRowsPerPage}
      onChangeOrder={(field, sortDesc) => {
        init(
          typeAccount,
          paginationRowsPerPage,
          paginationPage,
          paginationPage * paginationRowsPerPage,
          field,
          sortDesc ? 1 : 0,
        );
      }}
      onPageChange={(pageSettings) => {
        const { rowsPerPage, page } = pageSettings;
        init(typeAccount, rowsPerPage, page, page * rowsPerPage);
        setPaginationRowsPerPage(rowsPerPage);
        setPaginationPage(page);
      }}
      pagination
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
    />
  );
}

const mapStateToProps = (state) => ({
  admin: state.admin,
  users: state.users,
  filters: state.filters,
  subscription: state.subscription,
});

export default connect(mapStateToProps)(Accounts);
