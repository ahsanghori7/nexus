import React from 'react';
import i18next from 'v2/helpers/i18n';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { withStyles } from '@mui/styles';
import { CONSTANTS, Image } from 'clink-components';
import { expiredDate } from 'v2/helpers/date';
import ExpirationDate from 'v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate';
import Requester from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester';
import { alpha } from '@mui/material/styles';

const {
  alcumus,
  chas,
  considerate,
  constructiOnline,
  smas,
  iconCertificateGray,
} = CONSTANTS.s3;
const { proxima } = CONSTANTS.fonts;
const {
  lightPeriwinkle,
  white,
  webOrange,
  darkCharcoal,
  transparentGray,
  bostonRed,
} = CONSTANTS.colors.general;

const { prosperBoxGreen } = CONSTANTS.colors.prosper;

const icons = {
  'safe contractor': alcumus,
  chas,
  'considerate constructors': considerate,
  constructionline: constructiOnline,
  smas,
};

// TODO: Create helper to retrieve this and preq logos
const styles = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: alpha(transparentGray, 0.3),
    zIndex: 9999,
  },
};

const accreditationsSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  width: '100%',
  height: {
    xs: '100%',
    lg: '85%',
  },
  top: '0',
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
  if (!data?.date || expiredDate(new Date(data?.date))) {
    return (
      <Requester
        type={data.custom ? 'custom-certificate' : 'accreditation'}
        withSpan
        full
        sx={{
          ...accreditationsSx,
          backgroundColor: alpha(transparentGray, 0.3),
          '#open-modal-wrapper--label': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: webOrange,
            width: '140px',
            height: '22px',
            borderRadius: '3px',
            position: 'relative',
          },
        }}
        data={data}
        aid={aid}
      >
        {children}
      </Requester>
    );
  }
  return children;
};

const AccreditationData = ({ data, classes, aid }) => {
  return (
    <Wrapper data={data} aid={aid}>
      <Box sx={{ width: '100%', position: 'relative' }}>
        <Grid
          item
          xs={12}
          sx={{
            backgroundColor: white,
            p: '0!important',
            border: `1px solid ${lightPeriwinkle}`,
            borderRadius: '3px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', lg: 'center' },
            position: 'relative',
            width: '100%',
            '& span': {
              width: '100%',
              p: 2,
              maxWidth: { xs: '80px', lg: '143px' },
              '& img': {
                width: '100%',
                maxWidth: '147px',
                height: 'auto',
                maxHeight: '90px',
              },
            },
          }}
        >
          <Image
            src={
              !([data.label.toLowerCase()] in icons) ||
              data.section === 'custom-certificate'
                ? iconCertificateGray
                : icons[data.label.toLowerCase()]
            }
          />
          {!data.date && <div className={classes.overlay} />}
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            p: '0!important',
            textAlign: 'center',
            position: { xs: 'absolute', lg: 'relative' },
            top: { xs: 'calc(50% - 20px)', sm: 'calc(50% - 12px)', lg: 0 },
            right: { xs: '16px', lg: 0 },
            '& .MuiTypography-root': {
              flexDirection: { xs: 'column', lg: 'row' },
              maxWidth: { xs: '80px', sm: 'unset' },
            },
          }}
        >
          <ExpirationDate
            label={data.custom && data.label}
            date={data.date}
            expiresOnLabel={`${i18next.t('expiry-renewal-date')}:`}
            expirationDateFontSize="12px"
            notExpired={prosperBoxGreen}
            expirationColor={bostonRed}
            expirationDateColor={bostonRed}
          />
        </Grid>
      </Box>
    </Wrapper>
  );
};

export default withStyles(styles)(AccreditationData);
