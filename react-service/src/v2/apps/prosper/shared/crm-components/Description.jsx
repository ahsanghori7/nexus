import React from 'react';
import capitalize from 'lodash/capitalize';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { CONSTANTS } from 'clink-components';

const { prosperRedBorder, prosperBoxRed } = CONSTANTS.colors.prosper;
const { white } = CONSTANTS.colors.general;

const Description = ({
  text,
  gridSx = {},
  fontSx = { xs: '14px', md: '19px' },
  descFontSx = { xs: '14px', md: '16px' },
  loading = false,
}) => {
  const { t } = useTranslation();
  return !text && loading ? (
    <Skeleton variant="rectangular" width={210} height={60} />
  ) : (
    <Grid container item mt={1} sx={gridSx}>
      <Typography
        component="div"
        sx={{
          fontSize: fontSx,
          fontWeight: 'bold',
          width: '100%',
          marginTop: 1,
        }}
      >
        {capitalize(t('profile-description'))}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: descFontSx,
          fontWeight: 200,
          width: '100%',
          marginTop: 1,
          lineHeight: { xs: 1.75, sm: 1.5 },
          maxHeight: '250px',
          overflowY: 'scroll',
          overflowX: 'hidden',
          paddingRight: '10px',
          boxSizing: 'border-box',
          textAlign: 'justify',

          '&::-webkit-scrollbar': {
            width: '10px',
          },

          '&::-webkit-scrollbar-track': {
            boxShadow: `inset 0 0 5px ${white}`,
            borderRadius: '10px',
          },

          '&::-webkit-scrollbar-track:hover': {
            boxShadow: 'inset 0 0 5px gray',
          },

          '&::-webkit-scrollbar-thumb': {
            background: prosperBoxRed,
            borderRadius: '10px',
          },

          '&::-webkit-scrollbar-thumb:hover': {
            background: prosperRedBorder,
          },
        }}
      >
        {text}
      </Typography>
    </Grid>
  );
};

export default Description;
