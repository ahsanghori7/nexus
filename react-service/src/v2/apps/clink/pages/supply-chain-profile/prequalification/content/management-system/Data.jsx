import React from 'react';
import i18next from 'v2/helpers/i18n';
import Grid from '@mui/material/Grid';
import { CONSTANTS, Image } from 'clink-components';
import { expiredDate } from 'v2/helpers/date';
import ExpirationDate from 'v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate';
import Requester from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester';
import { alpha } from '@mui/material/styles';

const { iso14001, iso9001, ohas18001 } = CONSTANTS.s3;
const { proxima } = CONSTANTS.fonts;
const { webOrange, darkCharcoal, transparentGray } = CONSTANTS.colors.general;
const { prosperBoxGreen } = CONSTANTS.colors.prosper;

const icons = {
  'ISO 14001:2015': iso14001,
  'ISO 9001:2015': iso9001,
  'OHSAS 18001': ohas18001,
};

const managerSystemSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: '0',
  left: '0',
  textAlign: 'center',
  paddingTop: '4px',
  borderRadius: '3px',
  background: webOrange,
  fontSize: '14px',
  fontWeight: '600',
  fontFamily: proxima,
  color: darkCharcoal,
  cursor: 'pointer',
  zIndex: 9999,
};

const Wrapper = ({ children, data, aid }) => {
  if (!data.date || expiredDate(new Date(data.date))) {
    return (
      <Requester
        aid={aid}
        type="management-system"
        full
        withSpan
        wrapperSx={{ display: 'flex' }}
        sx={{
          ...managerSystemSx,
          backgroundColor: alpha(transparentGray, 0.3),
          '#open-modal-wrapper--label': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: webOrange,
            width: {
              xs: '90px',
              lg: '140px',
            },
            height: '22px',
            borderRadius: '3px',
            position: 'relative',
            left: {
              xs: '30px',
              sm: '0',
            },
          },
        }}
        data={data}
      >
        {children}
      </Requester>
    );
  }
  return children;
};

const ManagerSystemData = ({ data, aid }) => {
  return (
    <Wrapper data={data} aid={aid}>
      <Grid
        item
        sx={{
          flexBasis: '50px',
          p: 1,
          '& img': {
            width: '50px',
            height: '50px',
          },
        }}
      >
        <Image src={icons[data.label]} />
      </Grid>
      <Grid
        item
        sx={{
          p: '0!important',
          flexBasis: 'calc(100% - 50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'flex-end', md: 'center' },
          pr: { xs: '8px!important', lg: 0 },
          '& .MuiTypography-root': {
            flexDirection: { xs: 'column', md: 'row' },
            textAlign: { xs: 'center', sm: 'unset' },
          },
        }}
      >
        <ExpirationDate
          expirationDateFontSize={{ xs: '12px', md: '20px' }}
          expirationFontSize="12px"
          notExpired={prosperBoxGreen}
          date={data.date}
          expiresOnLabel={`${i18next.t('expiry-renewal-date')}:`}
        />
      </Grid>
    </Wrapper>
  );
};

export default ManagerSystemData;
