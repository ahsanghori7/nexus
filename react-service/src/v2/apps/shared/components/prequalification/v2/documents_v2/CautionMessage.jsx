import React from 'react';
import i18next from 'v2/helpers/i18n';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';

const { laceVeil, prosperBoxRed } = CONSTANTS.colors.prosper;

const style = { fontSize: '14px', color: prosperBoxRed };
const CautionMessage = () => {
  const message = `${i18next.t('caution').toUpperCase()}!`;
  return (
    <Box
      sx={{
        p: 1,
        mb: 1,
        backgroundColor: laceVeil,
        border: `1px solid ${prosperBoxRed}`,
        borderRadius: '8px',
      }}
    >
      <Typography sx={style}>{message}</Typography>
      <Typography sx={style}>{i18next.t('caution-message')}</Typography>
    </Box>
  );
};

export default CautionMessage;
