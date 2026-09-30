import React from 'react';
import Grid from '@mui/material/Grid';
import { getUrl } from 'v2/helpers/url';
import { MuiIconButton } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';

const urlConfig = (aid, type) => ({
  href: getUrl(
    'app_clink',
    `/relay?action=prequalification&method=downloadFiles&subcontractor=${aid}&type=${type}`
  ),
  target: '_blank',
  rel: 'noreferrer',
});

const DownloadFiles = ({ aid, label, type }) => (
  <Grid
    item
    xs={12}
    sx={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: '20px',
    }}
  >
    <MuiIconButton urlConfig={urlConfig(aid, type)} light>
      {label}
    </MuiIconButton>
  </Grid>
);

export default DownloadFiles;
