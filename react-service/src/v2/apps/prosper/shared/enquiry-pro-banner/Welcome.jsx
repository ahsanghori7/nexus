import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ProsperCarousel from 'v2/apps/prosper/shared/carousel';
import { Slide } from 'v2/apps/shared/styled/Page.styled';
import { CONSTANTS, Image } from 'clink-components';
import { renderHtmlInText } from 'v2/helpers/data';
import { getUrl, goTo } from 'v2/helpers/url';
import { StyledModalContainer, StyledNoWrap } from './styled';

const { white, blueMagentaViolet, aliceBlue } = CONSTANTS.colors.general;
const { prosperBlack, prosperBoxRed, prosperRedBorder } =
  CONSTANTS.colors.prosper;
const { iconPartyHorn, iconCloseRed } = CONSTANTS.s3;

const STEPS = 6;
const STEP_WITH_LINK = 2;

const ModalComponent = ({ setWelcome = [] }) => {
  const [open, setOpen] = setWelcome;
  const { t } = useTranslation();
  const theme = useTheme();

  const classes = {
    header: {
      display: 'flex !important',
      flexDirection: 'column !important',
      justifyContent: 'center !important',
      alignItems: 'center !important',
      fontSize: '30px !important',
      fontWeight: 'bold !important',
      color: prosperBlack,
      textAlign: 'center !important',
      position: 'relative !important',
    },
    closeButton: {
      position: 'absolute !important',
      top: '10px !important',
      right: '10px !important',
    },
    box: {
      display: 'flex !important',
      alignItems: 'start !important',
      justifyContent: 'start !important',
      flexDirection: 'column !important',
      minHeight: '257px !important',
      background: `${white} 0% 0% no-repeat padding-box !important`,
      boxShadow: '0px 3px 6px #00000029 !important',
      borderRadius: '13px !important',
      opacity: 1,
    },
    paper: {
      maxWidth: '974px !important',
      backgroundColor: `${aliceBlue} !important`,
      [theme.breakpoints.down('lg')]: {
        borderRadius: 0,
        width: '100% !important',
        maxHeight: '100% !important',
        maxWidth: '100% !important',
        margin: 0,
      },
    },
    footer: {
      justifyContent: 'center !important',
      padding: '36px 18px !important',
      [theme.breakpoints.down('md')]: {},
    },
    carousel: {
      '& > .carousel-root': {
        width: '100% !important',

        '& > .carousel.carousel-slider': {
          overflow: 'unset !important',

          '& > .control-arrow': {
            top: 'calc(50% - 20px) !important',
            opacity: 1,

            '&.control-next': {
              right: '-30px !important',
            },
            '&.control-prev': {
              left: '-30px !important',
            },
          },

          '& > .slider-wrapper': {
            borderRadius: '14px !important',
          },

          '& > .control-dots': {
            display: 'none',
          },

          '& > .carousel-status': {
            display: 'none',
          },
        },
      },
    },
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Dialog
        PaperProps={{ sx: classes.paper }}
        style={{
          backgroundColor: `${blueMagentaViolet}BF`,
        }}
        disableEscapeKeyDown
        open={open}
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={classes.header}>
          <Image src={iconPartyHorn} />
          <StyledNoWrap>
            {renderHtmlInText(t('prosper-pro-modal-welcome'))}
          </StyledNoWrap>
          <Box sx={classes.closeButton}>
            <Button onClick={handleClose}>
              <Image src={iconCloseRed} />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container p={3} pt={0} pb={0}>
            <Grid item xs={12} mb={3}>
              <Typography
                sx={{ fontSize: '13px', textAlign: 'center', fontWeight: 100 }}
              >
                {renderHtmlInText(t('prosper-pro-modal-welcome'))}!
                <br />
                {t('prosper-pro-modal-delighted')}
              </Typography>
            </Grid>
            <StyledModalContainer item xs={12} mb={3}>
              <Typography
                sx={{
                  fontSize: '24px',
                  color: prosperBlack,
                  fontWeight: 'bold',
                }}
              >
                {renderHtmlInText(t('prosper-pro-modal-how-it-works'))}
              </Typography>
            </StyledModalContainer>
            <Grid
              item
              container
              mb={4}
              xs={12}
              spacing={1}
              display={{ xs: 'flex', lg: 'none' }}
              sx={classes.carousel}
            >
              <ProsperCarousel
                showThumbs={false}
                showStatus={false}
                centerMode={false}
                showIndicators={false}
                renderArrowPrev={() => null}
                renderArrowNext={() => null}
              >
                {Array.from({ length: STEPS }, (_, i) => i + 1).map((item) => (
                  <Slide isMobile key={item}>
                    <div style={classes.box}>
                      <Box sx={{ display: 'flex' }} p={4} pb={1}>
                        <Typography
                          sx={{
                            color: prosperBoxRed,
                            fontSize: '21px',
                            fontWeight: 'bold',
                          }}
                        >
                          {`${item}. `}
                        </Typography>
                        <Typography
                          sx={{
                            color: blueMagentaViolet,
                            fontSize: '21px',
                            fontWeight: 'bold',
                            textAlign: 'left',
                          }}
                        >
                          {t(`prosper-pro-step-${item}-title`)}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: prosperBlack,
                          fontSize: '12px',
                          textAlign: 'left',
                        }}
                        p={4}
                        pt={1}
                      >
                        {t(`prosper-pro-step-${item}-description`)}&nbsp;
                        {item === STEP_WITH_LINK && (
                          <Link
                            href={`${BASE_URLS.PROSPER}${BASE_URLS.TOKENS}`}
                          >
                            {t('prosper-pro-modal-click-here')}
                          </Link>
                        )}
                      </Typography>
                    </div>
                  </Slide>
                ))}
              </ProsperCarousel>
            </Grid>
            <Grid
              item
              container
              mb={4}
              xs={12}
              spacing={1}
              display={{ xs: 'none', lg: 'flex' }}
            >
              {Array.from({ length: STEPS }, (_, i) => i + 1).map((item) => (
                <Grid item xs={4} key={item}>
                  <div style={classes.box}>
                    <Box sx={{ display: 'flex' }} p={3}>
                      <Typography
                        sx={{
                          color: prosperBoxRed,
                          fontSize: '21px',
                          fontWeight: 'bold',
                        }}
                      >
                        {`${item}.`}&nbsp;
                      </Typography>
                      <Typography
                        sx={{
                          color: blueMagentaViolet,
                          fontSize: '21px',
                          fontWeight: 'bold',
                        }}
                      >
                        {t(`prosper-pro-step-${item}-title`)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: prosperBlack,
                        fontSize: '12px',
                        fontWeight: 100,
                      }}
                      p={4}
                      pt={1}
                    >
                      {t(`prosper-pro-step-${item}-description`)}&nbsp;
                      {item === STEP_WITH_LINK && (
                        <Link href={`${BASE_URLS.PROSPER}${BASE_URLS.TOKENS}`}>
                          {t('prosper-pro-modal-click-here')}
                        </Link>
                      )}
                    </Typography>
                  </div>
                </Grid>
              ))}
            </Grid>
            <Grid item xs={12} m={1} mt={2}>
              <Typography sx={{ fontSize: '24px', fontWeight: 'bold' }}>
                {t('prosper-pro-modal-faq')}
              </Typography>
            </Grid>
            <Grid item xs={12} m={1}>
              <Typography
                sx={{
                  fontSize: '22px',
                  color: prosperBoxRed,
                  fontWeight: 'bold',
                }}
              >
                {t('prosper-pro-modal-what-cost')}
              </Typography>
            </Grid>
            <Grid item xs={12} m={1}>
              <Typography sx={{ fontSize: '16px' }}>
                {t('prosper-pro-modal-it-costs')}&nbsp;
                <Link href={`${BASE_URLS.PROSPER}${BASE_URLS.TOKENS}`}>
                  {t('prosper-pro-modal-click-here')}
                </Link>
              </Typography>
            </Grid>
            <Grid item xs={12} m={1} mt={4}>
              <Typography
                sx={{
                  fontSize: '22px',
                  color: prosperBoxRed,
                  fontWeight: 'bold',
                }}
              >
                {t('prosper-pro-modal-how-long')}
              </Typography>
            </Grid>
            <Grid item xs={12} m={1}>
              <Typography sx={{ fontSize: '16px' }}>
                {t('prosper-pro-modal-timescales')}
              </Typography>
            </Grid>
            <Grid item xs={12} m={1} mt={4}>
              <Typography
                sx={{
                  fontSize: '22px',
                  color: prosperBoxRed,
                  fontWeight: 'bold',
                }}
              >
                {t('prosper-pro-modal-projects-secured')}
              </Typography>
            </Grid>
            <Grid item xs={12} m={1}>
              <Typography sx={{ fontSize: '16px' }}>
                {t('prosper-pro-modal-approximately-secured')}
              </Typography>
            </Grid>
            <Grid item xs={12} m={1} mt={2}>
              <Link sx={{ fontSize: '16px' }} href={BASE_URLS.FAQ}>
                {t('prosper-pro-modal-all-faqs')}
              </Link>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={classes.footer}>
          <Button
            onClick={() =>
              goTo(`${getUrl('prosper', 'projects/find-opportunities')}`)
            }
            variant="contained"
            color="error"
            disableElevation
            sx={{
              flexDirection: 'column',
              border: `1px solid ${prosperRedBorder}`,
              width: '330px',
              height: '51px',
            }}
          >
            <Typography sx={{ fontSize: '17px', fontWeight: 'bold' }}>
              {t('prosper-pro-modal-view-opportunities')}
            </Typography>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ModalComponent;
