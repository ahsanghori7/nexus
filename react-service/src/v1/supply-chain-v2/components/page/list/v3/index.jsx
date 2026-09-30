import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Subscription from 'v2/helpers/user/subscription';
import { DataGridPro } from '@mui/x-data-grid-pro';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import SupplyChainHelper from 'v1/supply-chain-v2/helpers';
import StatusLight from 'v2/apps/clink/pages/supply-chain-profile/StatusLight';
import StatusActivated from 'v2/apps/clink/pages/supply-chain-profile/StatusActivated';
import columns from './columns';
import Actions from './actions';
import { Collapse, DetailPanelContent } from './mui.components';

const handleDetailPanelExpandedRowIdsChange = (newIds, setExpandedIds) => {
  if (newIds.length > 1) {
    setExpandedIds([newIds[newIds.length - 1]]);
  } else {
    setExpandedIds(newIds);
  }
};
const subscriptionHelper = new Subscription();

const ListV3 = ({
  data,
  total,
  editData,
  removeData,
  regions,
  trades,
  accountData,
  accountType,
  paginationRowsPerPage,
  setPaginationRowsPerPage,
  setOffset,
  order,
  setOrder,
  desc,
  setDesc,
  paginationPage,
  setPaginationPage,
  loadingContractors: isLoading,
  setAlertOpen,
  statuses,
}) => {

  const [detailPanelExpandedRowIds, setDetailPanelExpandedRowIds] = useState(
    [],
  );

  const rows = data.map((row) => {
    const statusesRow = statuses.filter(
      (s) => Number(s.account_id) === Number(row.id),
    );
    const { users: userList, subscription_id } = row;
    const users = userList.find((user) => user.user_type === 'account_holder');
    const isActivated =
      users?.account_id && !subscriptionHelper.isExternalMin(subscription_id);

    const newRow = {
      ...row,
      users,
    };
    return {
      id: newRow.id,
      ...SupplyChainHelper.showData(newRow),
      status: <StatusLight statusesRow={statusesRow} />,
      activated: <StatusActivated isActivated={isActivated} />,
      tradesCollapse: (
        <Collapse
          text="trades"
          row={newRow}
          array={newRow.trades || []}
          detailPanelExpandedRowIds={detailPanelExpandedRowIds}
          setDetailPanelExpandedRowIds={setDetailPanelExpandedRowIds}
        />
      ),
      locationsCollapse: (
        <Collapse
          text="locations"
          row={newRow}
          array={newRow.locations || []}
          detailPanelExpandedRowIds={detailPanelExpandedRowIds}
          setDetailPanelExpandedRowIds={setDetailPanelExpandedRowIds}
        />
      ),
      actions: (
        <Actions
          hasProperAccount={isActivated}
          row={newRow}
          editData={editData}
          removeData={removeData}
          regions={regions}
          trades={trades}
          accountData={accountData}
          accountType={accountType}
          setAlertOpen={setAlertOpen}
          users={users}
        />
      ),
      users,
    };
  });



  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <DataGridPro
        rows={rows}
        columns={columns}
        pagination
        paginationMode="server"
        rowCount={total}
        sortingMode="server"
        loading={isLoading}
        paginationModel={{
          page: paginationPage,
          pageSize: paginationRowsPerPage,
        }}
        onPaginationModelChange={({ page, pageSize }) => {
          const offset = pageSize * page;
          setOffset(offset);
          setPaginationPage(page);
          setPaginationRowsPerPage(pageSize);
        }}
        sortingOrder={['asc', 'desc']}
        sortModel={[{ field: order, sort: desc ? 'desc' : 'asc' }]}
        onSortModelChange={(model) => {
          const { field, sort } = model[0] || {};
          if (field && sort) {
            const descVal = sort === 'desc' ? 1 : 0;
            setOrder(field);
            setDesc(descVal);
          }
        }}
        getDetailPanelContent={DetailPanelContent}
        getDetailPanelHeight={() => 150}
        detailPanelExpandedRowIds={detailPanelExpandedRowIds}
        onDetailPanelExpandedRowIdsChange={(newIds) =>
          handleDetailPanelExpandedRowIdsChange(
            newIds,
            setDetailPanelExpandedRowIds,
          )
        }
      />
    </Box>
  );
};

ListV3.propTypes = {
  data: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  editData: PropTypes.func.isRequired,
  removeData: PropTypes.func.isRequired,
  regions: PropTypes.array.isRequired,
  trades: PropTypes.array.isRequired,
  accountData: PropTypes.object.isRequired,
  accountType: PropTypes.string.isRequired,
  paginationRowsPerPage: PropTypes.number.isRequired,
  setPaginationRowsPerPage: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  setOrder: PropTypes.func.isRequired,
  desc: PropTypes.number.isRequired,
  setDesc: PropTypes.func.isRequired,
  paginationPage: PropTypes.number.isRequired,
  setPaginationPage: PropTypes.func.isRequired,
  loadingContractors: PropTypes.bool.isRequired,
  setAlertOpen: PropTypes.func.isRequired,
  statuses: PropTypes.array,
};

export default ListV3;
