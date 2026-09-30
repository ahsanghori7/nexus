import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import EnquiriesV2 from 'v2/apps/prosper/pages/projects/enquiries_v2';
import i18next from 'v2/helpers/i18n';
import { ThemeProvider } from '@mui/material/styles';
import getTheme from 'v2/apps/shared/components/muiTheme';

const theme = getTheme('prosperEnquiries');

const config = {
  id: 7,
  path: 'enquiries',
  element: (
    <Prosper title={i18next.t('enquiries')}>
      <ThemeProvider theme={theme}>
        <EnquiriesV2 />
      </ThemeProvider>
    </Prosper>
  ),
  filter: [],
  filterCountry: [],
  label: i18next.t('enquiries'),
  redirects: [],
};

export default config;
