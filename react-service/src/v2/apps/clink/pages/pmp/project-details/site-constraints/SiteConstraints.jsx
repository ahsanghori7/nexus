import React from 'react';
import Grid2 from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import i18next from 'v2/helpers/i18n';

const SiteConstraints = ({ useUpdateProject = {} }) => {
  const {
    useSiteConstrains: [siteConstrains, setSiteConstrains],
  } = useUpdateProject;

  return (
    <Grid2 p={1.75} container>
      <Grid2 size={{ xs: 12 }}>
        <TextField
          label={i18next.t('site-constrains')}
          slotProps={{
            htmlInput: { 'data-testid': 'site-constrains-input' },
          }}
          variant="outlined"
          fullWidth
          multiline
          minRows={3}
          value={siteConstrains}
          onChange={(e) => setSiteConstrains(e.target.value)}
          placeholder={i18next.t('site-constrains-eg')}
        />
      </Grid2>
    </Grid2>
  );
};

export default SiteConstraints;
