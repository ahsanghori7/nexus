import React from 'react';
import moment from 'moment';
import i18next from 'v2/helpers/i18n';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { expiredDate } from 'v2/helpers/date';
import { CONSTANTS } from 'clink-components';

const { bostonRed, darkCharcoal } = CONSTANTS.colors.general;

const ExpirationDate = ({
  label = false,
  date,
  expiredLabel = i18next.t('expired-since'),
  expiresOnLabel = i18next.t('expires-on'),
  expirationFontSize = '12px',
  expirationDateFontSize = '20px',
  expirationColor = bostonRed,
  expirationDateColor = bostonRed,
  notExpired = darkCharcoal,
}) => {
  const isExpired = date ? expiredDate(new Date(date)) : false;

  return (
    <>
      {label && (
        <Box>
          <Typography
            component="span"
            sx={{
              fontSize: expirationFontSize,
              fontWeight: 'bold',
              color: darkCharcoal,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Typography>
        </Box>
      )}
      <Typography
        sx={{
          fontSize: expirationFontSize,
          display: 'inline-flex',
          alignItems: 'center',
          color: isExpired ? expirationColor : darkCharcoal,
        }}
      >
        {date ? (
          <>
            <Typography
              component="span"
              sx={{
                fontSize: expirationFontSize,
                color: isExpired ? expirationColor : darkCharcoal,
              }}
            >
              {isExpired ? expiredLabel : expiresOnLabel}
            </Typography>
            <Typography
              component="span"
              sx={{
                pl: '4px',
                fontSize: expirationDateFontSize,
                color: isExpired ? expirationDateColor : notExpired,
              }}
            >
              {String(moment(new Date(date)).format('DD/MM/YYYY'))}
            </Typography>
          </>
        ) : (
          <Typography
            component="span"
            sx={{
              fontSize: expirationDateFontSize,
            }}
          >
            {i18next.t('not-provided')}{' '}
          </Typography>
        )}
      </Typography>
    </>
  );
};

export default ExpirationDate;
