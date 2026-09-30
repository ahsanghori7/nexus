import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import i18next from 'v2/helpers/i18n';
import disabledTextFieldSx from './disabledSx';

const SummaryAndRecommendations = ({
  data,
  projectId,
  dispatch,
  actions,
  approvalRequestSent,
}) => {
  const [finalComment, setFinalComment] = useState('');

  useEffect(() => {
    if (data?.final_comment) {
      setFinalComment(data.final_comment);
    }
  }, [data?.final_comment]);

  const handleChange = (event) => {
    setFinalComment(event.target.value);
  };

  const handleBlur = () => {
    const tid = data?.tender_recommendation_id;

    if (projectId && tid && finalComment !== data?.final_comment) {
      dispatch(
        actions.updateTenderRecommendationById({
          project_id: projectId,
          tid,
          data: {
            final_comment: finalComment,
          },
        }),
      );
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid2 container spacing={2}>
        <Grid2 size={12}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {i18next.t('summary')}
          </Typography>
          <TextField
            data-testid="tr-summary-input"
            fullWidth
            placeholder={i18next.t('summary-placeholder')}
            size="small"
            multiline
            minRows={4}
            variant="outlined"
            value={finalComment}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={approvalRequestSent || data?.status === 'Pending'}
            sx={disabledTextFieldSx}
          />
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default SummaryAndRecommendations;
