import React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import i18next from 'v2/helpers/i18n';
import { getUrl } from 'v2/helpers/url';

const ProfileCompleteUpdate = () => (
  <Box
    sx={{
      maxWidth: '1378px',
      margin: 'auto',
      boxSizing: 'border-box',
      p: { xs: 2, sm: 3 },
      display: 'flex',
    }}
  >
    <Box sx={{ flexBasis: { xs: '100%', md: '50%' } }}>
      {i18next.t('profile-complete-update-1')}
      <Link
        target="_blank"
        href={`${getUrl('APP_PROSPER', `/my-company/prequalification`)}`}
        sx={{ cursor: 'pointer' }}
      >
        {i18next.t('profile-complete-update-2')}
      </Link>
      {i18next.t('profile-complete-update-3')}
      <Link
        target="_blank"
        href={`${getUrl('APP_PROSPER', `/projects/enquiries`)}`}
        sx={{ cursor: 'pointer' }}
      >
        {i18next.t('profile-complete-update-4')}
      </Link>
    </Box>
  </Box>
);

export default ProfileCompleteUpdate;
