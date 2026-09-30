import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import i18next from 'v2/helpers/i18n';
import disabledTextFieldSx from './disabledSx';

const ExecutiveSummary = ({
  data,
  projectId,
  dispatch,
  actions,
  approvalRequestSent,
}) => {
  const [execSummary, setExecSummary] = useState('');
  useEffect(() => {
    if (data?.exec_summary) {
      setExecSummary(data.exec_summary);
    }
  }, [data?.exec_summary]);

  const handleChange = (event) => {
    setExecSummary(event.target.value);
  };

  const handleBlur = () => {
    const tid = data?.tender_recommendation_id;
    if (projectId && tid && execSummary !== data?.exec_summary) {
      dispatch(
        actions.updateTenderRecommendationById({
          project_id: projectId,
          tid,
          data: {
            exec_summary: execSummary,
          },
        }),
      );
    }
  };

  return (
    <Grid2 container spacing={0} sx={{ flexDirection: 'column', px: 3, pb: 3 }}>
      <Grid2>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {i18next.t('reason-for-recommendation')}
        </Typography>
        <TextField
          data-testid="tr-executive-summary-input"
          fullWidth
          multiline
          rows={8}
          placeholder={i18next.t('provide-detailed-reasoning')}
          value={execSummary}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={approvalRequestSent || data?.status === 'Pending'}
          sx={disabledTextFieldSx}
        />
      </Grid2>
    </Grid2>
  );
};

export default ExecutiveSummary;
