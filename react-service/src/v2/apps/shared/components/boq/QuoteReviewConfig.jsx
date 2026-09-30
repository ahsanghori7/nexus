import React from 'react';
import Grid2 from '@mui/material/Grid2';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import MuiEllipsisTooltip from './MuiEllipsisTooltip';
import { CONSTANTS } from 'clink-components';
import capitalize from 'lodash/capitalize';
import highlightTooltip from './HighlightTooltip';

const { clinkBackgroundPurple, white } = CONSTANTS.colors.general;

const ID = 'id';
const DESCRIPTION = 'description';
const QTY = 'quantity';
const UNIT = 'unit';
const RATE = 'rate';
const TOTAL = 'total';

const COLUMN_ORDER = [ID, DESCRIPTION, QTY, UNIT, RATE, TOTAL];

const MAPPING_COLUMN_SUMMARY = {
  [ID]: 'ID',
  [DESCRIPTION]: 'Description',
  [QTY]: 'Q.ty',
  [UNIT]: 'Unit',
  [RATE]: 'Rate',
  [TOTAL]: 'Total',
};

const tableCellStyle = {
  border: '1px solid rgba(224, 224, 224, 1)',
  fontWeight: 600,
  padding: '4px 12px',
};

const Columns = () =>
  COLUMN_ORDER.map((name) => (
    <TableCell
      sx={{
        opacity: '0.4',
        ...tableCellStyle,
        borderLeftWidth: 0,
        '&:first-of-type': {
          borderRightWidth: 0,
          borderLeftWidth: 1,
        },
        '&:last-child': {
          display: 'none',
        },
      }}
      key={MAPPING_COLUMN_SUMMARY[name]}
    >
      {MAPPING_COLUMN_SUMMARY[name]}
    </TableCell>
  ));

const QuoteReviewTableRows = ({ rows }) =>
  rows.map((row) => {
    const highlightTooltipContent = highlightTooltip(row);
    const isSection = row?.type === 'section';
    const isHeading = row?.type === 'grouped_heading';
    const isItem = row?.type === 'item';
    const backgroundColor = `${
      isSection ? clinkBackgroundPurple : white
    } !important`;
    const newDesc =
      isSection || isHeading ? capitalize(row?.description) : row?.description;
    const decoration = isHeading ? { textDecoration: 'underline' } : {};

    let colSpanProp = isSection ? { colSpan: 6 } : {};
    colSpanProp = isHeading ? { colSpan: 5 } : colSpanProp;
    return (
      <TableRow
        sx={{
          height: '58px',
          backgroundColor,
          '&:last-of-type': { border: '1px solid rgba(224, 224, 224, 1)' },
        }}
        key={row.boq_item_id}
      >
        <TableCell sx={tableCellStyle}>
          {row.item_no}
        </TableCell>
        <TableCell sx={{ ...tableCellStyle, ...decoration }} {...colSpanProp}>
          <Grid2 container spacing={1}>
            <Grid2>
              {highlightTooltipContent}
            </Grid2>
            <Grid2>
              <MuiEllipsisTooltip tooltipContent={newDesc} />
            </Grid2>
          </Grid2>
        </TableCell>
        {isItem && (
          <>
            <TableCell sx={tableCellStyle}>{isItem && row?.quantity}</TableCell>
            <TableCell sx={tableCellStyle}>{isItem && row?.unit}</TableCell>
            <TableCell sx={tableCellStyle}>{isItem && row?.rate}</TableCell>
            <TableCell sx={tableCellStyle}>{isItem && row?.total}</TableCell>
          </>
        )}
      </TableRow>
    );
  });

export default QuoteReviewTableRows;
export { Columns };
