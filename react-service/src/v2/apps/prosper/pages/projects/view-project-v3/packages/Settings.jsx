import React from 'react';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { getUrl } from 'v2/helpers/url';
import { CONSTANTS } from 'clink-components';

const { prosperBoxGreen, prosperBoxRed } = CONSTANTS.colors.prosper;

const Settings = ({ text }) => {
  const { t } = useTranslation();
  return (
    <Typography
        component="h2"
        sx={{
          fontSize: {
            xs: 11,
            sm: 12,
            md: 16,
          },
          '& > strong': {
            color: prosperBoxRed,
            fontWeight: 'bold',
          },
        }}
      >
        {text}
        <Link
          sx={{
            color: prosperBoxGreen,
            textDecorationColor: prosperBoxGreen,
          }}
          href={getUrl(
            'APP_PROSPER',
            'my-company/profile/trades-and-locations'
          )}
        >
          {t('profile-settings')}
        </Link>
      </Typography>
  );
};

export default Settings;
