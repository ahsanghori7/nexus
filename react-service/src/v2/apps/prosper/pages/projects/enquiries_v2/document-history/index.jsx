import React from 'react';
import i18next from 'v2/helpers/i18n';
import capitalize from 'lodash/capitalize';
import isArray from 'lodash/isArray';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { CONSTANTS } from 'clink-components';
import DocRow from './DocRow';

const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { dimGray2 } = CONSTANTS.colors.prosper;
const borderTable = `1px solid ${dimGray2}`;
const headerStyle = {
  borderBottom: borderTable,
  borderRight: 'none',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '14px',
  fontFamily: avantGardeGothicPRO,
};
const headers = [
  { title: 'received-date', style: { ...headerStyle, width: '27%' } },
  { title: 'profile-description', style: { ...headerStyle, width: '28%' } },
  { title: 'version-number', style: { ...headerStyle, width: '41%' } },
  { title: '', style: { ...headerStyle, width: '4%' } },
];

const applyBorder = (index, total) =>
  index === total - 1 ? 'none' : borderTable;

const DocumentHistory = ({ selected }) => {
  const enquiry = selected?.document?.enquiry;
  const order = selected?.document?.order;
  const tender_addendum = selected?.document?.tender_addendum;

  const listEnquiry = isArray(enquiry) ? enquiry : [enquiry];
  const listOrder = isArray(order) ? order : [order];
  const listTenderAddendum = isArray(tender_addendum)
    ? tender_addendum
    : [tender_addendum];

  return (
    <Paper sx={{ padding: 4 }}>
      <Typography variant="title2">{i18next.t('enquiry-history')}</Typography>
      <TableContainer
        data-testid="document-history-table"
        component={Paper}
        sx={{
          marginTop: '17px',
          border: borderTable,
          borderRadius: '5px',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header.title} sx={header.style} {...header}>
                  {capitalize(i18next.t(header.title))}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {listEnquiry.map(
              (row, index) =>
                row && (
                  <DocRow
                    key={row.date}
                    index={++index}
                    row={row}
                    documentName="Tender document"
                    applyBorder={applyBorder(index, listEnquiry.length)}
                  />
                )
            )}
            {listOrder.map(
              (row, index) =>
                row && (
                  <DocRow
                    key={row.date}
                    index={++index}
                    row={row}
                    documentName="Order"
                    applyBorder={applyBorder(index, listOrder.length)}
                  />
                )
            )}
            {listTenderAddendum.map(
              (row, index) =>
                row && (
                  <DocRow
                    key={row.date}
                    index={++index}
                    row={row}
                    documentName="Tender addendum"
                    applyBorder={applyBorder(index, listTenderAddendum.length)}
                  />
                )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DocumentHistory;
