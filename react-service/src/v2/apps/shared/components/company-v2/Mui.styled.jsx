import React from 'react';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import DOMPurify from 'dompurify';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import LinearProgress from '@mui/material/LinearProgress';
import { Box, CircularProgress } from '@mui/material';

const { prosperBoxRed, lightSilver } = CONSTANTS.colors.prosper;
const { white, clinkRed, black, darkJungleGreen, grayDark } =
  CONSTANTS.colors.general;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { iconBlackBin, iconReuseBlack, iconTargetBlack, iconRoundPoundBlack } =
  CONSTANTS.s3;

// TODO: Delete this file from hell and just use the Mui

const MuiSubtitle = ({ children, red = true, sx }) => {
  return (
    <Typography
      sx={{
        margin: '10px 0',
        display: 'block',
        fontSize: '14px',
        color: red ? prosperBoxRed : darkJungleGreen,
        fontWeight: red ? 700 : 200,
        ...sx,
      }}
      variant="title"
    >
      {children}
    </Typography>
  );
};

const MuiSubmitWrapper = ({ loading, children, prequal = false }) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        mt: prequal ? { xs: 7, md: 4 } : 4,
        position: 'relative',
      }}
    >
      {loading && (
        <CircularProgress
          sx={{ position: 'absolute', left: 0, right: 0, margin: 'auto' }}
        />
      )}

      {children}
    </Box>
  );
};

const MuiCompanyAvatar = ({ picSrc, onDelete }) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '243px',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'block' },
          mb: '20px',
          mt: { md: '20px' },
        }}
      >
        <Avatar
          alt={i18next.t('profile-logo')}
          src={picSrc}
          sx={{ width: 137, height: 137 }}
        />
        <Button
          onClick={onDelete}
          sx={{
            position: 'absolute',
            top: 0,
            right: '-28px',
            display: 'block',
            minWidth: '17px',
            padding: '4px',
          }}
        >
          <Avatar
            variant="square"
            alt={i18next.t('delete-profile-logo')}
            src={iconBlackBin}
            sx={{
              width: 17,
              height: 21,
            }}
          />
        </Button>
      </Box>
    </Box>
  );
};

const MuiInvalidInput = ({ children }) => {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        position: 'absolute',
        bottom: '-17px',
        fontStyle: 'italic',
        fontWeight: 'bold',
      }}
      color={clinkRed}
    >
      {children}
    </Typography>
  );
};

const GreetingCard = ({ intro = null, image, subtitle, description }) => {
  return (
    <Card
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        display: 'flex',
      }}
    >
      <CardContent sx={{ paddingLeft: 0, paddingBottom: 0 }}>
        <CardMedia
          sx={{
            height: 64,
            width: 64,
            flexBasis: 64,
            backgroundSize: '44px',
            backgroundColor: intro ? grayDark : white,
            padding: '10px',
            boxSizing: 'border-box',
          }}
          component="img"
          image={image}
          title={subtitle}
        />
      </CardContent>
      <CardContent sx={{ paddingBottom: '0!important' }}>
        <Typography
          sx={{ fontWeight: 'bold', fontSize: 16 }}
          variant="subtitle1"
          color={black}
        >
          {subtitle}
        </Typography>
        <Typography sx={{ fontSize: 16 }} variant="body1" color={black}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const MuiGreetingSection = ({
  title = 'greetings-preq-v2-title',
  intro = null,
  outtro = null,
}) => {
  const titleSx = { fontSize: 16 };
  if (intro) {
    titleSx.mb = 5;
    titleSx.fontSize = 18;
    titleSx.fontWeight = 'bold';
  }
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'initial' },
        flexBasis: '50%',
        padding: '40px 30px 30px',
        boxSizing: 'border-box',
        maxWidth: '480px',
        margin: ' 0 auto',
      }}
    >
      <Typography variant="subtitle1" sx={titleSx}>
        {i18next.t(title)}
      </Typography>

      {intro && (
        <Typography sx={{ fontSize: 16 }} variant="body1" color={black}>
          {i18next.t(intro)}
        </Typography>
      )}

      <GreetingCard
        intro={intro}
        image={iconRoundPoundBlack}
        subtitle={i18next.t('greetings-preq-v2-subtitle-1')}
        description={i18next.t('greetings-preq-v2-text-1')}
      />

      <GreetingCard
        intro={intro}
        image={iconTargetBlack}
        subtitle={i18next.t('greetings-preq-v2-subtitle-2')}
        description={i18next.t('greetings-preq-v2-text-2')}
      />

      <GreetingCard
        intro={intro}
        image={iconReuseBlack}
        subtitle={i18next.t('greetings-preq-v2-subtitle-3')}
        description={i18next.t('greetings-preq-v2-text-3')}
      />

      {outtro && (
        <Typography
          variant="body1"
          sx={{
            fontSize: 16,
            marginTop: 5,
            '& > strong': { fontWeight: 600 },
          }}
          data-i18n="[html]content.body"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              i18next.t(outtro, {
                interpolation: { escapeValue: false },
              }),
            ),
          }}
        />
      )}
    </Box>
  );
};

const MuiRequired = ({ children }) => {
  return (
    <>
      {children}
      <Box component="span" color={black}>
        *
      </Box>
    </>
  );
};

const MuiCompanyTitle = ({ title, anthem }) => {
  return (
    <Box
      sx={{
        '& p': {
          display: 'inline',
          pr: 1,
          fontSize: '17px',
          fontFamily: avantGardeGothicPRO,
        },
      }}
    >
      <Typography sx={{ fontWeight: 900 }} variant="body1">
        {title}
      </Typography>
      <Typography sx={{ fontWeight: 100 }} variant="body1">
        {`(${anthem})`}
      </Typography>
    </Box>
  );
};

const ProgressBar = ({ percentComplete = 0 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'row-reverse', md: 'column' },
        my: { xs: 2, md: 0 },
        mx: { xs: 3, md: 0 },
      }}
    >
      <Typography
        sx={{ mb: { md: '-12px' }, mt: { md: 0 }, pl: { xs: 1, md: 0 } }}
        variant="body1"
      >
        <Typography
          sx={{ fontSize: { xs: '16px', md: '70px' } }}
          component="span"
        >
          {percentComplete}%
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            pl: 1,
            display: { xs: 'none', md: 'initial' },
          }}
          component="span"
        >
          {i18next.t('profile-complete')}
        </Typography>
      </Typography>
      <LinearProgress
        sx={{
          '&.MuiLinearProgress-root': {
            height: { xs: '10px', md: '15px' },
            borderRadius: { xs: '5px', md: '15px' },
            backgroundColor: lightSilver,
            width: { xs: 'calc(100% - 40px)', md: '100%' },
            mt: { xs: '6px', md: 0 },

            '& .MuiLinearProgress-bar': {
              backgroundColor: prosperBoxRed,
              borderRadius: '15px',
            },
          },
        }}
        variant="determinate"
        value={percentComplete}
      />
    </Box>
  );
};

export {
  MuiSubtitle,
  MuiSubmitWrapper,
  MuiCompanyAvatar,
  MuiInvalidInput,
  MuiGreetingSection,
  MuiRequired,
  MuiCompanyTitle,
  ProgressBar,
};
