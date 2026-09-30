import React from 'react';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import Table from 'v2/apps/shared/components/boq/Table';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';
import QuoteHistoryTableRows, {
  Columns,
} from 'v2/apps/shared/components/boq/quote-history-config';

const QuoteHistory = ({ data = [], entity = {}, subcontractor = {} }) => {
  let newRows = [];
  Object.values(data).forEach((element) => {
    const sections = element?.sections;
    const created_at = element?.created_at;
    const version = element?.version;
    const date = created_at
      ? moment(created_at).format('DD/MM/YYYY HH:mm:ss')
      : 'N/A';
    const price = sections?.quotation_price
      ? parseCurrency(
          sections?.quotation_price,
          currencyConfig[i18next.t('currency')]
        )
      : 'N/A';
    const work = sections?.measured_work
      ? parseCurrency(
          sections?.measured_work,
          currencyConfig[i18next.t('currency')]
        )
      : 'N/A';
    const prelims = sections?.prelims
      ? parseCurrency(sections?.prelims, currencyConfig[i18next.t('currency')])
      : 'N/A';
    const sums = sections?.other_items
      ? parseCurrency(
          sections?.other_items,
          currencyConfig[i18next.t('currency')]
        )
      : 'N/A';
    const weeks = sections?.weeks?.text || 'N/A';
    newRows = [
      ...newRows,
      {
        id: uuidv4(),
        entity,
        subcontractor,
        version,
        date,
        price,
        work,
        prelims,
        sums,
        weeks,
      },
    ];
  });
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '22px', mb: 2 }}>
        {i18next.t('quote-history')}
      </Typography>
      <Table
        Columns={Columns}
        items={newRows}
        Body={QuoteHistoryTableRows}
        actions={false}
      />
    </Box>
  );
};

export default QuoteHistory;
