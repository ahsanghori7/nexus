import React from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import capitalize from 'lodash/capitalize';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';

const { clinkBackgroundPurple, white } = CONSTANTS.colors.general;

const ID = 'item_no';
const DESC = 'description';
const QTY = 'quantity';
const UNIT = 'unit';
const RATE = 'budget_rate';
const TOTAL = 'budget_total';

const COLUMN_ORDER = [ID, DESC, QTY, UNIT, RATE, TOTAL];

const MAPPING_COLUMN_SUMMARY = {
  [ID]: 'ID',
  [DESC]: 'Description',
  [QTY]: 'Q.ty',
  [UNIT]: 'Unit',
  [RATE]: 'Budget Rate',
  [TOTAL]: 'Budget Total',
};

const tableCellStyle = {
  border: '1px solid rgba(224, 224, 224, 1)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  p: '5px',
  maxWidth: '170px',
};

const Columns = () =>
  COLUMN_ORDER.map((name) => (
    <TableCell
      sx={{
        fontWeight: 600,
        opacity: '0.5',
        pt: '5px',
        pb: '4px',
        ...tableCellStyle,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        '&:first-of-type': {
          borderLeftWidth: 1,
        },
        '&:last-child': {
          borderRightWidth: 1,
        },
      }}
      key={MAPPING_COLUMN_SUMMARY[name]}
    >
      {MAPPING_COLUMN_SUMMARY[name]}
    </TableCell>
  ));

const TenderAnalysisConfig = ({ rows }) =>
  rows.map((row) => {
    const isSection = row.type === 'section';
    const isGroupedHeader = row.type === 'grouped_heading';
    const isItem = row.type === 'item';
    const desc =
      isSection || isGroupedHeader ? capitalize(row[DESC]) : row[DESC];

    const descSx = {
      ...tableCellStyle,
      ...(isGroupedHeader ? { textDecoration: 'underline' } : {}),
    };
    const backgroundColor = `${
      isSection ? clinkBackgroundPurple : white
    } !important`;

    let colSpanProp = isSection ? { colSpan: 6 } : {};
    colSpanProp = isGroupedHeader ? { colSpan: 5 } : colSpanProp;
    return (
      <TableRow sx={{ height: '58px', backgroundColor }} key={row.id}>
        <TableCell sx={tableCellStyle}>{row[ID]}</TableCell>
        <TableCell sx={descSx} {...colSpanProp}>
          <Tooltip sx={{ lineHeight: 1 }} title={desc}>
            <Typography
              component="div"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '170px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {desc}
            </Typography>
          </Tooltip>
        </TableCell>
        {isItem && (
          <>
            <TableCell sx={tableCellStyle}>{isItem && row[QTY]}</TableCell>
            <TableCell sx={tableCellStyle}>{isItem && row[UNIT]}</TableCell>
            <TableCell sx={tableCellStyle}>
              {isItem &&
                parseCurrency(row[RATE], currencyConfig[i18next.t('currency')])}
            </TableCell>
            <TableCell sx={tableCellStyle}>
              {isItem &&
                parseCurrency(
                  row[TOTAL],
                  currencyConfig[i18next.t('currency')]
                )}
            </TableCell>
          </>
        )}
      </TableRow>
    );
  });

export default TenderAnalysisConfig;
export { Columns };
