import React, { useState, useEffect } from 'react';
import List from './list';
import ResponseAlert from 'v2/apps/shared/components/responseAlert';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const Container = ({
  term = '',
  contractors = [],
  removeData,
  editData,
  addData,
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
}) => {
  const { t } = useTranslation();
  const [alertOpen, setAlertOpen] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  useEffect(() => {
    let timer;
    if (alertOpen?.open) {
      timer = setTimeout(() => {
        setAlertOpen({ ...alertOpen, open: false, message: '' });
      }, 5000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [alertOpen]);

  const { severity, open, message } = alertOpen;
  const handleClose = () => setAlertOpen({ ...alertOpen, open: false });
  return (
    <>
      <ResponseAlert
        sx={{ color: 'white !important' }}
        open={open}
        severity={severity}
        variant="filled"
        handleClose={handleClose}
        setOpen={handleClose}
        message={message}
      />
      {!contractors.length ? (
        <Typography variant="h6" display={'flex'} justifyContent={'center'} alignItems={'center'} width={'100%'} data-testid="supply-chain-no-results">{t('no-subcontractors-found')}</Typography>
      ) : (
        <List
          data={contractors}
          removeData={removeData}
          editData={editData}
          regions={regions}
          trades={trades}
          total={total}
          paginationRowsPerPage={paginationRowsPerPage}
          setPaginationRowsPerPage={setPaginationRowsPerPage}
          setOffset={setOffset}
          order={order}
          setOrder={setOrder}
          desc={desc}
          statuses={statuses}
          setDesc={setDesc}
          paginationPage={paginationPage}
          setPaginationPage={setPaginationPage}
          accountData={accountData}
          accountType={accountType}
          loadingContractors={loadingContractors}
          setAlertOpen={setAlertOpen}
        />
      )}
    </>
  );
};

export default Container;
