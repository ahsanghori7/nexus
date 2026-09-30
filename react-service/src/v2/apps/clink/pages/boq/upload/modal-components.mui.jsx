import React from 'react';
import moment from 'moment';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Container from '@mui/material/Container';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';

const { black, white, prim } = CONSTANTS.colors.general;

const sxTable = {
  height: 50,
  padding: 0,
  paddingLeft: 2,
  backgroundColor: 'white',
};
const sxTablBold = {
  ...sxTable,
  fontWeight: 'bold',
};

const sxBox = {
  width: '100px',
  textWrap: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const MuiModalTable = ({ tableContent, maxHeight = '200px' }) => (
  <TableContainer
    sx={{ maxHeight: `${maxHeight}`, maxWidth: '800px' }}
    component={Paper}
  >
    <Table aria-label="simple table">
      <TableHead sx={sxTable}>
        <TableRow sx={sxTable}>
          <TableCell sx={sxTablBold}>Type</TableCell>
          <TableCell sx={sxTablBold}>Item No</TableCell>
          <TableCell sx={sxTablBold}>Description</TableCell>
          <TableCell sx={sxTablBold}>Quantity</TableCell>
          <TableCell sx={sxTablBold}>Unit</TableCell>
          <TableCell sx={sxTablBold}>Budget Rate</TableCell>
          <TableCell sx={sxTablBold}>Budget Total</TableCell>
          <TableCell sx={sxTablBold}>Tenderee Notes</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tableContent.map((row) => {
          const isGroupedHeaderOrItem =
            row.type === 'grouped_heading'
              ? { ...sxTablBold, textDecoration: 'underline' }
              : sxTable;
          const isSection =
            row.type === 'section'
              ? { ...sxTablBold, backgroundColor: prim }
              : isGroupedHeaderOrItem;
          return (
            <TableRow key={row.description} sx={sxTable}>
              <TableCell sx={isSection}>{row.type}</TableCell>
              <TableCell sx={isSection}>{row.item_no}</TableCell>
              <TableCell sx={isSection}>
                <Tooltip title={row.description}>
                  <Box sx={sxBox}>{row.description}</Box>
                </Tooltip>
              </TableCell>
              <TableCell sx={isSection}>{row.quantity}</TableCell>
              <TableCell sx={isSection}>{row.unit}</TableCell>
              <TableCell sx={isSection}>{row.budget_rate}</TableCell>
              <TableCell sx={isSection}>{row.budget_total}</TableCell>
              <TableCell sx={isSection}>
                <Tooltip title={row.tenderee_note}>
                  <Box sx={sxBox}>{row.tenderee_note}</Box>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

const MuiModalErrorTable = ({
  tableContent,
  maxHeight = '200px',
  maxWidth,
  file = null,
}) => (
  <>
    <Container>
      <Typography
        variant="title2"
        fontWeight="bold"
        component="h1"
        sx={{ mb: 1 }}
      >
        {i18next.t('boq-error-report-1')}
      </Typography>
      <Typography variant="normal" component="p">
        <b>{i18next.t('boq-error-report-2')}:</b> [{file?.name}]
      </Typography>
      <Typography component="p">
        <b>{i18next.t('boq-error-report-3')}:</b> [
        {moment().format('MMMM Do YYYY')}]
      </Typography>
      <Typography component="p">
        <b>{i18next.t('status')}:</b> {i18next.t('boq-error-report-4')}
      </Typography>
      <Typography component="p" mb={1}>
        <b>{i18next.t('summary')}:</b> {i18next.t('boq-error-report-5')}
      </Typography>
    </Container>
    <TableContainer sx={{ maxHeight, maxWidth }} component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Row</TableCell>
            <TableCell>Column</TableCell>
            <TableCell>Provided Value</TableCell>
            <TableCell>Error Type</TableCell>
            <TableCell>System Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableContent.map((row) => (
            <TableRow key={row.Row}>
              <TableCell>{row.Row}</TableCell>
              <TableCell>{row.Column}</TableCell>
              <TableCell>{row['Provided Value']}</TableCell>
              <TableCell>{row['Error Type']}</TableCell>
              <TableCell>{row['System Message']}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Container>
      <Typography
        variant="title2"
        fontWeight="bold"
        component="h1"
        sx={{ mb: 1, mt: 1 }}
      >
        {i18next.t('boq-error-report-6')}:
      </Typography>
      <ul>
        <li>
          <Typography>
            <b>{i18next.t('boq-error-report-7')}:</b>{' '}
            {i18next.t('boq-error-report-8')}
          </Typography>
        </li>
        <li>
          <Typography>
            <b>{i18next.t('boq-error-report-9')}:</b>{' '}
            {i18next.t('boq-error-report-10')}
          </Typography>
        </li>
        <li>
          <Typography>
            <b>{i18next.t('boq-error-report-11')}:</b>{' '}
            {i18next.t('boq-error-report-12')}
          </Typography>
        </li>
      </ul>
      <Typography>{i18next.t('boq-error-report-13')}</Typography>
    </Container>
  </>
);

const MuiModalTextarea = ({ placeholder }) => (
  <InputBase
    multiline
    sx={{
      width: '100%',
      minHeight: '180px',
      alignItems: 'flex-start',
      marginTop: '4px',
      p: 1,
      '& textarea::placeholder': {
        color: black,
        opacity: 0.5,
        textAlign: 'start',
        pt: 0,
        fontSize: '14px',
      },
      textarea: {
        paddingTop: 0,
        paddingBottom: 1,
        lineHeight: 1.5,
        fontSize: '14px',
      },
    }}
    placeholder={placeholder}
  />
);

const MuiModalUploadItem = ({ fileName, size, onClick }) => {
  let newSize = (size && Number.parseFloat(size / 1024).toFixed(2)) || 0;
  newSize =
    newSize > 1024
      ? `${Number.parseFloat(newSize / 1024).toFixed(2)}mb`
      : `${newSize}kb`;
  return (
    <Grid container sx={{ justifyContent: 'space-between' }}>
      <Grid item sx={{ flexBasis: 'calc(100% - 70px)' }}>
        <Typography sx={{ wordBreak: 'break-all', fontSize: '18px' }}>
          {fileName}
        </Typography>
        {/* Todo: add file size and remove hardcoded */}
        <Typography
          sx={{
            wordBreak: 'break-all',
            fontSize: '14px',
            opacity: '0.5',
          }}
        >
          {newSize}
        </Typography>
      </Grid>
      <Grid item sx={{ flexBasis: '60px' }}>
        <Button
          sx={{ textDecoration: 'underline', padding: 0 }}
          onClick={onClick}
        >
          {i18next.t('boq-remove')}
        </Button>
      </Grid>
    </Grid>
  );
};

const MuiModalButton = ({ children, onClick, sx = {} }) => (
  <Grid container sx={{ flexBasis: '100%', justifyContent: 'flex-end' }}>
    <Button
      variant="contained"
      sx={{
        fontSize: '14px',
        color: white,
        borderRadius: '20px',
        boxShadow: 'none',
        padding: '4px 30px',
        ...sx,
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  </Grid>
);

export {
  MuiModalTable,
  MuiModalTextarea,
  MuiModalUploadItem,
  MuiModalButton,
  MuiModalErrorTable,
};
