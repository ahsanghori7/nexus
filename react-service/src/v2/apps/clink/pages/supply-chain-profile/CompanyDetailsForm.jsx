import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { checkIfImageExists } from 'v2/helpers/url';
import { MuiContactsList } from './contacts/mui.styled';

const { black, clinkLightPurple, gray2, clinkGreen } = CONSTANTS.colors.general;
const { proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

const textAlignStyle = { textAlign: { xs: 'center', sm: 'left' } };
const labelSX = {
  fontFamily: `${proxima_nova1}, ${proxima_nova2}`,
  color: gray2,
  fontSize: '14px',
  ...textAlignStyle,
};
const infoSX = {
  fontFamily: `${proxima_nova1}, ${proxima_nova2}`,
  fontSize: { md: '16px' },
  color: black,
  mb: 3,
  ...textAlignStyle,
};
const mainBlocks = { spacing: 2, xs: 12, md: 6, mb: 2 };

const MuiCompanyDetails = ({ details, logos, members = [] }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  const { email, registered_address, mobile, website } = details;
  const { company } = logos;
  const [logoExists, setLogoExists] = useState(false);

  useEffect(() => {
    checkIfImageExists(company, (exists) => {
      setLogoExists(exists);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoExists, logos]);

  let openEmail = () => null;
  let openPhone = () => null;
  const emailStyles = { ...textAlignStyle };
  const phoneStyles = { ...textAlignStyle };
  if (!matches) {
    openEmail = () => {
      window.location.href = `mailto:${email}`;
    };
    openPhone = () => {
      window.location.href = `tel:${mobile}`;
    };
    emailStyles.cursor = 'pointer';
    phoneStyles.cursor = 'pointer';
  }
  return (
    <Grid container spacing={1}>
      <Grid container item {...mainBlocks}>
        <Grid
          item
          xs={12}
          sm={4}
          md={6}
          sx={{
            display: { xs: 'flex', sm: 'block' },
            justifyContent: 'center',
          }}
        >
          {logoExists && (
            <Card
              variant="outlined"
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: `1px solid ${clinkLightPurple}`,
                borderRadius: '8px',
                padding: 1,
                maxWidth: { xs: '200px', sm: 'unset' },
              }}
            >
              <CardMedia
                component="img"
                alt={t('profile-company-logo')}
                image={company}
                sx={{
                  maxHeight: 221,
                }}
              />
            </Card>
          )}
        </Grid>
        <Grid item xs={12} sm={8} md={6}>
          <Typography sx={{ ...labelSX }}>{t('profile-address')}</Typography>
          <Typography sx={{ ...infoSX, maxWidth: { md: '178px' } }}>
            {registered_address}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item {...mainBlocks}>
        <Grid item xs={12} md={7}>
          <Box sx={emailStyles} onClick={openEmail}>
            <Typography sx={labelSX}>{t('main-company-email')}</Typography>
            <Typography sx={infoSX}>{email}</Typography>
          </Box>
          <Box sx={phoneStyles} onClick={openPhone}>
            <Typography sx={labelSX}>{t('main-company-phone')}</Typography>
            <Typography sx={infoSX}>{mobile}</Typography>
          </Box>
          <Typography sx={labelSX}>{t('company_website')}</Typography>
          <Typography sx={infoSX}>
            <Link
              target="_blank"
              sx={{
                color: clinkGreen,
                '&:hover': {
                  textDecoration: 'underline!important',
                  color: clinkGreen,
                },
              }}
              rel="noopener noreferrer"
              underline="hover"
              href={
                website && website.includes('http')
                  ? website
                  : `https://${website}`
              }
            >
              {website}
            </Link>
          </Typography>
        </Grid>
        <Grid item xs={12} md={5}>
          <Typography sx={labelSX}>{t('other-contacts')}</Typography>
          <MuiContactsList contacts={members} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MuiCompanyDetails;
