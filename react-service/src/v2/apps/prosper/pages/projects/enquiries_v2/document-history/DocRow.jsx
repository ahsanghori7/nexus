import React from 'react';
import moment from 'moment';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import { Download as DownloadIcon } from '@mui/icons-material';
import { CONSTANTS } from 'clink-components';
import { goToNewTab } from 'v2/helpers/url';

const { dimGray2, prosperBoxRed } = CONSTANTS.colors.prosper;
const borderTable = `1px solid ${dimGray2}`;

const DocRow = ({ row, documentName, index, applyBorder }) => {
  const downloadFiles = () => {
    if (row) {
      const documentId = row?.id;
      const url =
        (documentId && `/relay/v1/document/${documentId}/download`) || '';

      goToNewTab(url);
    }
  };
  return (
    <TableRow key={row.date}>
      <TableCell
        sx={{
          color: dimGray2,
          textAlign: 'center',
          borderRight: borderTable,
          borderBottom: applyBorder,
        }}
      >
        {row && row.date
          ? moment(row.date).format('DD/MM/YYYY - HH:mm:ss')
          : ''}
      </TableCell>
      <TableCell
        sx={{
          color: dimGray2,
          textAlign: 'center',
          borderRight: borderTable,
          borderBottom: applyBorder,
        }}
      >
        {documentName}
      </TableCell>
      <TableCell
        sx={{
          color: dimGray2,
          textAlign: 'center',
          borderRight: '',
          borderBottom: applyBorder,
        }}
      >
        {`${documentName} ${index}`}
      </TableCell>
      <TableCell
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderLeft: borderTable,
          borderRight: 'none',
          borderBottom: applyBorder,
        }}
      >
        <IconButton data-testid={`doc-row-download-${row.id}`} onClick={() => downloadFiles()}>
          <DownloadIcon sx={{ color: prosperBoxRed }} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default DocRow;
