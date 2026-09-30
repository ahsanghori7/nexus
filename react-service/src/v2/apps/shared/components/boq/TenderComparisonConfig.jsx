import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Grid from '@mui/material/Grid';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import capitalize from 'lodash/capitalize';

const { clinkBackgroundPurple, white, clinkGreen, clinkPurple } =
  CONSTANTS.colors.general;

const RATE = 'rate';
const TOTAL = 'total';
const COMP = 'company';

const COLUMN_ORDER = [RATE, TOTAL, COMP];

const MAPPING_COLUMN_SUMMARY = {
  [RATE]: 'Rate',
  [TOTAL]: 'Total',
  [COMP]: 'Company',
};

const tableCellStyle = {
  border: '1px solid rgba(224, 224, 224, 1)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  pt: '5px',
  pb: '5px',
  fontWeight: 600,
  borderRightWidth: 0,
  px: 1,
  verticalAlign: 'middle',
  textAlign: 'left',
  '&:first-of-type': {
    borderLeftWidth: 0,
    borderRightWidth: 1,
  },
};

const Columns = () =>
  COLUMN_ORDER.map((name) => (
    <TableCell
      sx={{
        fontWeight: 600,
        opacity: '0.4',
        pb: '4px',
        pt: 1,
        ...tableCellStyle,
        borderWidth: 0,
        '&:last-child': {
          display: 'none',
        },
      }}
      key={MAPPING_COLUMN_SUMMARY[name]}
    >
      {MAPPING_COLUMN_SUMMARY[name]}
    </TableCell>
  ));

const TenderAnalysisConfig = ({ rows }) =>
  rows.map((row) => {
    const { best, priceMatch } = row;

    const isSection = row.type === 'section';
    const isGroupedHeader = row.type === 'grouped_heading';
    const isItem = row.type === 'item';
    const desc =
      isSection || isGroupedHeader
        ? capitalize(row.description)
        : row.description;

    const backgroundColor = `${
      isSection ? clinkBackgroundPurple : white
    } !important`;

    const descSx = {
      ...tableCellStyle,
      ...(isGroupedHeader ? { textDecoration: 'underline' } : {}),
    };

    let labelBest = 'best-price';
    if (best && priceMatch) {
      labelBest = 'price-matched';
    }
    return (
      <TableRow key={row.boq_item_id} sx={{ height: '58px', backgroundColor }}>
        <TableCell colSpan={(isItem && 1) || 2} sx={descSx}>
          {isItem ? row.rate : desc}
        </TableCell>
        {isItem && (
          <TableCell sx={descSx}>
            <Grid container sx={{ position: 'relative' }}>
              {row.total}
              {best ? (
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: clinkPurple,
                    position: 'absolute',
                    top: '14px',
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      color: clinkGreen,
                      width: '16px',
                      marginRight: '2px',
                    }}
                  />
                  {i18next.t(labelBest)}
                </Typography>
              ) : (
                ''
              )}
            </Grid>
          </TableCell>
        )}
      </TableRow>
    );
  });

export default TenderAnalysisConfig;
export { Columns };
