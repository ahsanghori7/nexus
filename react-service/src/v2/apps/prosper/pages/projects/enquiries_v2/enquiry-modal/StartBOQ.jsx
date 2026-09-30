import React from 'react';
import { goTo } from 'v2/helpers/url';
import MuiButton from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { CONSTANTS, Image } from 'clink-components';
import { CommonContent } from './CommonModal';

const { white } = CONSTANTS.colors.general;
const { sendQuoteBOQ } = CONSTANTS.s3;

const whiteSX = { color: `${white} !important` };
const fontWeightThinSX = { fontWeight: '100 !important' };
const fontWeightBoldSX = { fontWeight: 'bold' };
const textSX = { ...whiteSX, pb: 1, fontSize: '15.5px' };
const linktSX = { ...whiteSX, ...fontWeightThinSX };

const StartBOQ = ({ setStep = () => null, enquiry }) => {
  const { id, slug } = enquiry;
  const { t } = useTranslation();
  const nextPage = () => setStep(1);
  const redirect = () => goTo(`enquiries/submit-quote/${slug}/${id}`);
  return (
    <CommonContent
      title="new-quote-exp"
      subtitle={t('new-quote-exp-sub')}
      sxTitle={fontWeightThinSX}
      sxSubtitle={fontWeightBoldSX}
    >
      <Box
        className="no-legacy"
        component="span"
        sx={{
          '& > span': {
            maxWidth: '380px',
            overflow: 'hidden',
          },
        }}
      >
        <Image
          src={sendQuoteBOQ}
          style={{ height: '400px', borderRadius: '10px' }}
        />
      </Box>
      <Typography component="p" sx={{ ...textSX, pt: 2 }}>
        {t('new-quote-exp-text-1')}
      </Typography>
      <Typography component="p" sx={{ ...textSX, ...fontWeightThinSX }}>
        {t('new-quote-exp-text-2')}
      </Typography>
      <Typography component="p" sx={{ ...textSX, pb: 2 }}>
        <b>{t('new-quote-exp-text-3')}</b>
      </Typography>
      <Typography component="p" sx={{ ...textSX, ...fontWeightThinSX }}>
        {t('new-quote-exp-text-4')}
      </Typography>
      <Typography component="p" sx={{ ...textSX, ...fontWeightThinSX }}>
        {t('new-quote-exp-text-5')}
      </Typography>
      <Typography component="p" sx={{ ...textSX, ...fontWeightThinSX }}>
        {t('new-quote-exp-text-6')}
      </Typography>
      <Typography
        component="p"
        sx={{ ...textSX, ...fontWeightThinSX, pt: 2, pb: 2 }}
      >
        {t('new-quote-exp-text-7')}
      </Typography>
      <MuiButton
        data-testid="start-boq-redirect-btn"
        fullWidth
        variant="contained"
        color="success"
        onClick={redirect}
        sx={whiteSX}
      >
        {t('new-quote-exp-text-button')}
      </MuiButton>
      <Typography component="p" sx={{ ...whiteSX, ...fontWeightBoldSX, pt: 1 }}>
        OR
      </Typography>
      <MuiButton data-testid="start-boq-legacy-btn" variant="link" onClick={nextPage} sx={{ ...whiteSX, pl: 0 }}>
        <Typography
          component="span"
          sx={{ ...linktSX, textDecoration: 'underline' }}
        >
          Go to
        </Typography>
        <span style={{ width: '8px' }} />
        <Typography
          component="span"
          sx={{ ...linktSX, textDecoration: 'none' }}
        >
          {t('new-quote-exp-text-8')}
        </Typography>
      </MuiButton>
    </CommonContent>
  );
};

export default StartBOQ;
