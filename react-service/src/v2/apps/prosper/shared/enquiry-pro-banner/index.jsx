import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CancelIcon from '@mui/icons-material/Cancel';
import { CONSTANTS, Image } from 'clink-components';
import { renderHtmlInText } from 'v2/helpers/data';
import { analytics } from 'services/helpers';
import Welcome from './Welcome';
import Info from './Info';
import { StyledModalContainer } from './styled';

const { prosperProBg, prosperRedBorder } = CONSTANTS.colors.prosper;
const {
  poundWhite,
  iconWhiteBell,
  iconWhiteClock,
  iconThumbnailBuildingsDesktop,
  iconThumbnailBuildingsMobile,
  iconThumbnailWorkers,
} = CONSTANTS.s3;

const EnquiryProBanner = ({
  show = true,
  opportunities,
  subcontractor,
  upgradeProsperPro,
  closeBanner = () => {},
}) => {
  const [welcome, setWelcome] = useState(false);
  const theme = useTheme();

  const classes = {
    root: {
      backgroundColor: prosperProBg,
      color: theme.palette.common.white,
      display: 'flex',
      padding: '0px 23px',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'transform 0.3s ease',
      zIndex: 9999,
      position: 'sticky',
      bottom: 0,
      maxWidth: 'unset !important',
      [theme.breakpoints.up('lg')]: {
        padding: '0px 142px !important',
      },
    },
    item: {
      minHeight: '25px',
      margin: '8px 0px',
      [theme.breakpoints.up('lg')]: {
        minHeight: '100px',
        margin: '0px',
      },
    },
    image: {
      maxHeight: '132px',
      maxWidth: '206px',
      position: 'absolute',
      marginLeft: 'auto',
      marginRight: 'auto',
      textAlign: 'center',
      top: '-60px',
      left: '-30px',
      right: 0,
    },
    imageMobile: {
      maxHeight: '110px',
      maxWidth: '170px',
      position: 'absolute',
      marginLeft: 'auto',
      marginRight: 'auto',
      textAlign: 'center',
      top: '-80px',
      left: 0,
      right: 0,
    },
  };
  const { t } = useTranslation();

  useEffect(() => {
    const app = document.querySelector('.app');
    app.style.maxHeight = '100vh';
  }, []);

  return (
    <>
      {show && !welcome && (
        <Slide direction="up" in={show} mountOnEnter unmountOnExit>
          <Container maxWidth="lg" sx={classes.root} spacing={0}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
              <IconButton onClick={closeBanner}>
                <CancelIcon color="error" />
              </IconButton>
            </Box>
            <Grid container>
              <Grid
                item
                xs={12}
                display={{ xs: 'block', lg: 'none' }}
                sx={{ ...classes.item, position: 'relative' }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '-90px;',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'center',
                    right: 0,
                    left: 0,
                  }}
                >
                  <Image src={iconThumbnailBuildingsMobile} />
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Image src={iconThumbnailWorkers} sx={classes.imageMobile} />
                </Box>
              </Grid>
              <StyledModalContainer item lg={9} xs={12} sx={classes.item}>
                <Typography
                  sx={{
                    fontSize: {
                      xs: '22px',
                      lg: '27px',
                    },
                    textAlign: {
                      xs: 'center',
                      lg: 'start',
                    },
                    width: '100%',
                    fontWeight: '100',
                    display: 'inline-block',
                  }}
                >
                  {renderHtmlInText(
                    t('prosper-jobs-found-profile', { count: opportunities })
                  )}
                </Typography>
              </StyledModalContainer>
              <Grid
                item
                lg={3}
                display={{ xs: 'none', lg: 'block' }}
                sx={{ ...classes.item, position: 'relative' }}
              >
                <Box sx={{ position: 'absolute', top: '-50px;' }}>
                  <Image src={iconThumbnailBuildingsDesktop} />
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Image src={iconThumbnailWorkers} sx={classes.image} />
                </Box>
              </Grid>
              <Grid item lg={3} xs={12} sx={classes.item}>
                <Info
                  icon={poundWhite}
                  title={t('prosper-pro-stay-busy')}
                  description={t('prosper-pro-stay-busy-desc')}
                />
              </Grid>
              <Grid item lg={3} xs={12} sx={classes.item}>
                <Info
                  icon={iconWhiteClock}
                  title={t('prosper-pro-save-time')}
                  description={t('prosper-pro-save-time-desc')}
                />
              </Grid>
              <Grid item lg={3} xs={12} sx={classes.item}>
                <Info
                  icon={iconWhiteBell}
                  title={t('prosper-pro-nail-process-management')}
                  description={t('prosper-pro-nail-process-management-desc')}
                />
              </Grid>
              <Grid item lg={3} xs={12} sx={classes.item}>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  disableElevation
                  sx={{
                    flexDirection: 'column',
                    border: `1px solid ${prosperRedBorder}`,
                  }}
                  onClick={() =>
                    upgradeProsperPro().then(() => {
                      if (subcontractor && subcontractor.contractor_id) {
                        analytics(
                          'supply_chain.prosper_pro.manual',
                          null,
                          subcontractor.contractor_id
                        );
                      }
                      setWelcome(true);
                    })
                  }
                >
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {t('prosper-pro-access')}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: '100' }}>
                    {t('prosper-pro-find-first-job-free')}
                  </Typography>
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Slide>
      )}{' '}
      {welcome && <Welcome setWelcome={[welcome, setWelcome]} />}
    </>
  );
};

export default EnquiryProBanner;
