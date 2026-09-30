import React from 'react';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const Other = ({ useUpdateProject = {} }) => {
  const {
    useGia: [gia, setGia],
  } = useUpdateProject;
  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>{i18next.t('others')}</Typography>
      </Grid2>
      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12 }}>
          <TextField
            label={i18next.t('gia')}
            variant="outlined"
            type="number"
            fullWidth
            slotProps={{
              htmlInput: { 'data-testid': 'others-gia-input' },
            }}
            value={gia}
            onChange={(e) => setGia(e.target.value)}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default Other;
