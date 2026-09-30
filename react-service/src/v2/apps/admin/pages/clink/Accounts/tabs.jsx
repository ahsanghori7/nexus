import React from 'react';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import DataTable from 'v2/apps/admin/DataTable';

const tabs = (contextType, totalEnquiries = 0, totalQuotes = 0) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = useParams();
  const id = params.accountId;

  const options = [
    {
      id: 0,
      label: t('engagement'),
      content: (
        <>
          <Typography variant="h6" pt={6}>
            {t('enquiries_sent')}:&nbsp;
            <b>{totalEnquiries}</b>
          </Typography>
          <Typography variant="h6">
            {t('orders_sent')}:&nbsp;
            <b>{totalQuotes}</b>
          </Typography>
          <DataTable
            id={id}
            contextType={contextType}
            dataType="engagement"
            table="account"
          />
        </>
      ),
    },
  ];

  return options;
};

export default tabs;
