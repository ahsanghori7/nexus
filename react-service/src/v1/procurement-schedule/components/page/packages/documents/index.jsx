import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { getProjectUrl } from 'v2/helpers/url';
import Typography from '@mui/material/Typography';
import {
  MuiDocumentsBox,
  MuiDocumentsContainer,
  MuiLogContainer,
  MuiLogBox,
} from './mui.styled';
import httpHelper from 'v2/services/httpHelper';

const Documents = ({ slug, pack, awarded }) => {
  const navigate = useNavigate();
  const {
    has_document: hasDocument,
    has_boq: hasBoq,
    id: tid,
    label: packLabel,
  } = pack;

  const redirect = (tenderId = 0) =>
    `/main-contractor/project/${slug}/boq${tenderId ? `/${tenderId}` : ''}`;

  const params = { tid };
  if (hasDocument) {
    params.tender_addendum = 'true';
  }
  const url = getProjectUrl(slug, `issue_enquiry`, params);
  const label = !hasDocument
    ? 'Create Tender Document'
    : 'Create Tender Addendum';

  const boqRedirect = redirect(tid);
  const boqSummaryRedirect = redirect('summary');

  const createBoq = () => {
    httpHelper({ url: `boq/entity/${tid}`, method: 'POST' }).then(() =>
      navigate(boqRedirect)
    );
  };

  return (
    <Paper sx={{ marginBottom: '1px', p: 4 }}>
      <Grid container>
        <Grid item xs={6}>
          <Typography sx={{ fontSize: '16px', px: 1 }}>Documents</Typography>
        </Grid>
        <Grid item xs={6}>
          <MuiLogContainer>
            {Boolean(hasBoq) && (
              <MuiLogBox url={boqSummaryRedirect}>BoQ summary</MuiLogBox>
            )}
            {/* TODO: Check what needs to happen here */}
            {/* {(Boolean(hasDocument) || Boolean(hasTenderAddendum)) && (
              <MuiLogBox>View all tender logs</MuiLogBox>
            )} */}
          </MuiLogContainer>
        </Grid>
      </Grid>
      <MuiDocumentsContainer>
        {Boolean(hasBoq) && (
          <MuiDocumentsBox url={boqRedirect}>
            {packLabel} Price Breakdown
          </MuiDocumentsBox>
        )}
      </MuiDocumentsContainer>
      {!awarded && (
        <Box>
          {!hasBoq && (
            <Button
              sx={{
                mr: 3,
              }}
              variant="outlined"
              onClick={createBoq}
            >
              Create Digital Price Breakdown
            </Button>
          )}
          <Button to={url} LinkComponent={Link} variant="contained">
            {label}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default Documents;
