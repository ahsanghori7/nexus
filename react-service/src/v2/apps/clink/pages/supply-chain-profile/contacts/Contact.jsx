import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { checkIfImageExists } from 'v2/helpers/url';
import { CONSTANTS } from 'clink-components';

const { iconHammerBlack } = CONSTANTS.s3;
const { darkCharcoal } = CONSTANTS.colors.general;
const { dimGray2 } = CONSTANTS.colors.prosper;
const { proxima } = CONSTANTS.fonts;

const common = {
  color: darkCharcoal,
  fontFamily: proxima,
  fontSize: '10px',
};
const center = {
  textAlign: 'center',
  justifyContent: 'center',
};
const MAX_LENGTH_EMAIL = 26;
const Contact = ({ data = {}, mobile = false }) => {
  const [logoExists, setLogoExists] = useState(false);

  useEffect(() => {
    checkIfImageExists(data.logo, (exists) => {
      setLogoExists(exists);
    });
  }, [logoExists, data]);

  const avatarStyle = { width: 110, height: 110, marginBottom: 1.1 };
  let cardStyle = { maxWidth: 158 };
  let openEmail = () => null;
  let openPhone = () => null;
  const emailStyles = { borderTop: `0.2px solid ${dimGray2}` };
  const phoneStyles = {};
  const [firstPartEmail, lastPartEmail] =
    (data && data.email && data.email.split('@')) || '';
  if (mobile) {
    avatarStyle.zIndex = 1111;
    cardStyle = { maxWidth: 230, boxShadow: 'none' };
    openEmail = () => {
      window.location.href = `mailto:${data.email}`;
    };
    openPhone = () => {
      window.location.href = `tel:${data.phone}`;
    };
    emailStyles.cursor = 'pointer';
    phoneStyles.cursor = 'pointer';
    phoneStyles.marginTop = 3;
  }
  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ paddingBottom: 0 }}>
        <Grid justifyContent="center" container>
          <Avatar
            sx={avatarStyle}
            alt="contact-item"
            src={logoExists ? data.logo : iconHammerBlack}
          />
        </Grid>
        <Grid justifyContent="center" container sx={{ minHeight: 84 }}>
          <Grid item textAlign="center">
            <Typography
              {...common}
              fontSize={mobile ? '22px' : '16px'}
              fontWeight={600}
            >
              {`${data.firstname || ''} ${data.lastname || ''}`}
            </Typography>
            <Typography
              {...common}
              fontSize={mobile ? '14px' : '10px'}
              sx={{ pb: 3 }}
            >
              {data.title || ''}
            </Typography>
          </Grid>
          {data.phone && (
            <Grid justifyContent="center" item container alignItems="end">
              <Typography
                {...common}
                fontSize={mobile ? '22px' : '14px'}
                sx={phoneStyles}
                onClick={openPhone}
              >
                {data.phone}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
      <CardActions sx={center}>
        <Box sx={emailStyles} onClick={openEmail}>
          {data && data.email && (
            <Typography
              {...common}
              fontSize={mobile ? '16px' : '10px'}
              sx={{ marginTop: 1 }}
            >
              {data.email.length > MAX_LENGTH_EMAIL ? (
                <>
                  {firstPartEmail}
                  <br />@{lastPartEmail}
                </>
              ) : (
                data.email
              )}
            </Typography>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default Contact;
