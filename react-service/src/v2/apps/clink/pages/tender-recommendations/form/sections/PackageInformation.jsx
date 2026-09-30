import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import disabledTextFieldSx from './disabledSx';

const PackageInformation = ({ tenderRecommendationById }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {i18next.t('package-name')}
          </Typography>
          <TextField
            fullWidth
            placeholder={i18next.t('enter-package-name')}
            size="small"
            variant="outlined"
            disabled
            sx={disabledTextFieldSx}
            value={tenderRecommendationById?.package_name || ''}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {i18next.t('trade-category')}
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            disabled
            sx={disabledTextFieldSx}
            value={
              tenderRecommendationById?.trade_category ||
              i18next.t('multiple-trade-categories')
            }
          />
        </Grid2>
      </Grid2>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  tenderRecommendationById: state.tenderRecommendation.tenderRecommendationById,
});

export default connect(mapStateToProps)(PackageInformation);
