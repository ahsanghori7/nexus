import React from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import { CONSTANTS } from 'clink-components';

const { clinkPurple, christmasSilver } = CONSTANTS.colors.general;

const ITEM_NO = 'item_no';
const DESC = 'description';
const BGT = 'budget';
const STATUS = 'status';

const COLUMN_ORDER = [ITEM_NO, DESC, BGT, STATUS];

const MAPPING_COLUMN_SUMMARY = {
  [ITEM_NO]: 'Package number',
  [DESC]: 'Package Title',
  [BGT]: 'Budget',
  [STATUS]: 'Status',
};

const getStatusText = (status) => {
  switch (status) {
    case 1:
      return 'Initialized';
    case 2:
      return 'Draft';
    case 3:
      return 'Published';
    case 4:
      return 'Deleted';
    case 5:
      return 'Archived';
    case 6:
      return 'Tendered';
    default:
      return 'Unknown';
  }
};

const Columns = () =>
  COLUMN_ORDER.map((name) => (
    <TableCell sx={{ fontWeight: 'bold' }} key={MAPPING_COLUMN_SUMMARY[name]}>
      {MAPPING_COLUMN_SUMMARY[name]}
    </TableCell>
  ));

const cellStyle = { p: 0, pl: 2 };

const SummaryConfig = ({ rows, navigate = () => null }) => {
  let totalBudget = 0;
  return (
    <>
      {rows.map((row, i) => {
        const handleClick = () => navigate(row.tid);
        totalBudget += Number(row.budget);
        return (
          <TableRow sx={{ height: '40px' }} key={row.id}>
            <TableCell
              sx={{
                ...cellStyle,
                width: '150px',
                borderRight: `1px solid ${christmasSilver}`,
              }}
            >
              {i + 1}
            </TableCell>
            <TableCell
              sx={{
                cursor: 'pointer',
                color: clinkPurple,
                ...cellStyle,
                borderRight: `1px solid ${christmasSilver}`,
              }}
              onClick={handleClick}
            >
              {row.label}
            </TableCell>
            <TableCell
              sx={{
                ...cellStyle,
                borderRight: `1px solid ${christmasSilver}`,
              }}
            >
              {parseCurrency(row.budget, currencyConfig[i18next.t('currency')])}
            </TableCell>
            <TableCell sx={cellStyle}>{getStatusText(row.status)}</TableCell>
          </TableRow>
        );
      })}
      <TableRow key="summary">
        <TableCell colSpan={2} sx={{ p: 1 }} />
        <TableCell colSpan={2} sx={{ p: 1 }}>
          <Typography sx={{ pl: 1, fontWeight: 600 }}>Total</Typography>
          <Typography
            sx={{
              pl: 1,
              fontWeight: 600,
              fontSize: '20px',
            }}
          >
            {parseCurrency(totalBudget, currencyConfig[i18next.t('currency')])}
          </Typography>
        </TableCell>
      </TableRow>
    </>
  );
};

export default SummaryConfig;
export { Columns };
