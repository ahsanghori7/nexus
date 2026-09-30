import React from 'react';
import TableV3 from './v3';

// TODO: remove this redundant file in the future
const List = ({
  data,
  editData,
  removeData,
  regions,
  trades,
  total,
  paginationRowsPerPage,
  setPaginationRowsPerPage,
  setOffset,
  order,
  statuses,
  setOrder,
  desc,
  setDesc,
  paginationPage,
  setPaginationPage,
  accountData,
  accountType,
  loadingContractors,
  setAlertOpen,
}) => {
  return (
    <TableV3
      data={data}
      editData={editData}
      removeData={removeData}
      regions={regions}
      trades={trades}
      accountData={accountData}
      accountType={accountType}
      total={total}
      paginationRowsPerPage={paginationRowsPerPage}
      setPaginationRowsPerPage={setPaginationRowsPerPage}
      setOffset={setOffset}
      order={order}
      setOrder={setOrder}
      statuses={statuses}
      desc={desc}
      setDesc={setDesc}
      paginationPage={paginationPage}
      setPaginationPage={setPaginationPage}
      loadingContractors={loadingContractors}
      setAlertOpen={setAlertOpen}
    />
  );
};

export default List;
