import * as React from 'react';
import Table from '@mui/material/Table';
import Grid from '@mui/material/Grid';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import i18next from 'v2/helpers/i18n';
import MuiEllipsisTooltip from 'v2/apps/shared/components/boq/MuiEllipsisTooltip';
import Subscription from 'v2/helpers/user/subscription';
import { getUrl } from 'v2/helpers/url';
import { CONSTANTS } from 'clink-components';

const { clinkGreen, clinkRed, white } = CONSTANTS.colors.general;

const subscriptionHelper = new Subscription();

const Wrapper = ({ children, membership }) => {
  if (
    membership?.account_id &&
    membership?.subscription_id &&
    !subscriptionHelper.isExternalMin(membership?.subscription_id)
  ) {
    const url = getUrl(
      'CLINK_APP_HOST',
      `/main-contractor/supply_chain/${membership?.account_id}?return=sc`,
    );
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <MuiEllipsisTooltip tooltipContent={children} />
      </a>
    );
  }
  return children;
};

export default function HeaderTable({
  name,
  summaryCurrency,
  programme,
  actions,
  marginCurrency,
  margin,
  bestPrice,
  bestProgramme,
  subcontractor = {},
}) {
  const leftTableCellStyle = {
    p: '4px',
    textAlign: 'left',
    width: '50%',
    borderRight: '1px solid rgba(224, 224, 224, 1)',
  };
  const rightTableCellStyle = { p: 1, textAlign: 'left', width: '50%' };

  const { membership } = subcontractor;

  const red = Number(margin) < 0 ? { color: clinkRed } : {};
  return (
    <TableContainer
      sx={{
        height: '227px',
        border: 'none',
        boxShadow: 'none',
        '&::WebkitScrollbar': {
          display: 'none',
        },
      }}
      component={Paper}
    >
      <Table
        sx={{
          minWidth: 200,
          '& .MuiTableRow-root:nth-of-type(even)': { backgroundColor: white },
        }}
        aria-label="simple table"
      >
        <TableHead sx={{ border: 'none' }}>
          <TableRow>
            <TableCell sx={{ p: '4px', textAlign: 'center' }} colSpan={2}>
              {<Wrapper membership={membership}>{name}</Wrapper>}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell sx={leftTableCellStyle} align="right">
              <MuiEllipsisTooltip
                tooltipContent={i18next.t('ta-total-price')}
              />
            </TableCell>
            <TableCell sx={rightTableCellStyle} align="right">
              <MuiEllipsisTooltip tooltipContent={summaryCurrency} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={leftTableCellStyle} align="right">
              <MuiEllipsisTooltip
                tooltipContent={i18next.t('ta-programme-weeks')}
              />
            </TableCell>
            <TableCell sx={rightTableCellStyle} align="right">
              <MuiEllipsisTooltip tooltipContent={programme} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={leftTableCellStyle} align="right">
              <MuiEllipsisTooltip tooltipContent={i18next.t('ta-margin')} />
            </TableCell>
            <TableCell sx={{ ...rightTableCellStyle, ...red }} align="right">
              <MuiEllipsisTooltip tooltipContent={marginCurrency} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              sx={{ p: '4px', height: '30px', fontWeight: 'bold' }}
              align="center"
              colSpan={2}
            >
              <Grid container justifyContent="space-around">
                {bestPrice && (
                  <Grid item>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      <CheckCircleIcon
                        sx={{
                          color: clinkGreen,
                          width: '16px',
                          marginRight: '2px',
                          marginTop: '-4px',
                        }}
                      />
                      {i18next.t('best-priced')}
                    </Typography>
                  </Grid>
                )}
                {bestProgramme && (
                  <Grid item>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      <CheckCircleIcon
                        sx={{
                          color: clinkGreen,
                          width: '16px',
                          marginRight: '2px',
                          marginTop: '-4px',
                        }}
                      />
                      {i18next.t('best-programme')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ p: 1 }} align="center" colSpan={2}>
              {actions}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
