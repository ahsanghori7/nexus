import React from 'react';
import Box from '@mui/material/Box';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { CONSTANTS } from 'clink-components';
import Menu from './Menu';

const { white } = CONSTANTS.colors.general;

const RECEPTION = 'reception';
const QUOTATION = 'quotation';
const WORK = 'work';
const PRELIMS = 'prelims';
const SUMS = 'sums';
const WEEKS = 'weeks';

const COLUMN_ORDER = [RECEPTION, QUOTATION, WORK, PRELIMS, SUMS, WEEKS];

const MAPPING_COLUMN_SUMMARY = {
  [RECEPTION]: 'Reception date',
  [QUOTATION]: 'Quotation price',
  [WORK]: 'Measured work',
  [PRELIMS]: 'Prelims',
  [SUMS]: 'Prov Sums / Other Items',
  [WEEKS]: 'Weeks',
};

const tableCellStyle = {
  border: '1px solid rgba(224, 224, 224, 1)',
  fontWeight: 500,
  padding: '4px 12px',
};

const Columns = () =>
  COLUMN_ORDER.map((name) => {
    return (
      <TableCell
        sx={{
          ...tableCellStyle,
          borderLeftWidth: 0,
          backgroundColor: white,
          fontWeight: 600,
          verticalAlign: 'top',
          '&:first-of-type': {
            borderRightWidth: 1,
            borderLeftWidth: 1,
          },
        }}
        key={MAPPING_COLUMN_SUMMARY[name]}
      >
        {/* Investigate colSpan further or other solution to hide last cell */}
        <Box
          sx={{ maxWidth: '80px', lineHeight: '1.2', py: 1, opacity: '0.4' }}
        >
          {MAPPING_COLUMN_SUMMARY[name]}
        </Box>
      </TableCell>
    );
  });

const QuoteHistoryTableRows = ({ rows }) => {
  const ActionWrapper = ({ children, row }) => (
    <TableCell sx={tableCellStyle}>
      <Box
        sx={{
          width: '100',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {children}
        <Menu row={row} />
      </Box>
    </TableCell>
  );

  const SumsWrapper = ({ children }) => (
    <TableCell sx={tableCellStyle}>{children}</TableCell>
  );
  const WeekWrapper = ({ children, row }) => (
    <ActionWrapper row={row}>{children}</ActionWrapper>
  );

  return rows.map((row) => {
    return (
      <TableRow
        sx={{
          height: '58px',
          '&:last-of-type': { border: '1px solid rgba(224, 224, 224, 1)' },
          '&:nth-of-type(2n)': { backgroundColor: white },
          '&:hover': { opacity: 0.5 },
        }}
        key={row.id}
      >
        <TableCell sx={tableCellStyle}>{row.date}</TableCell>
        <TableCell sx={{ ...tableCellStyle }}>{row.price}</TableCell>

        <TableCell sx={tableCellStyle}>{row.work}</TableCell>
        <TableCell sx={tableCellStyle}>{row.prelims}</TableCell>
        <SumsWrapper row={row}>
          <Box>{row.sums}</Box>
        </SumsWrapper>
        <WeekWrapper row={row}>
          <Box>{row.weeks}</Box>
        </WeekWrapper>
      </TableRow>
    );
  });
};

export default QuoteHistoryTableRows;
export { Columns };
