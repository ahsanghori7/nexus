import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import i18next from 'v2/helpers/i18n';
import adminColors from 'v2/constants/colors';
import AppLinearProgress from '../AppLinearProgress';
import getAnalysisProgress from './getAnalysisProgress';

const { clinkGreen } = adminColors;

const AnalysisJobProgress = ({ analysisData, barColor = clinkGreen }) => {
  const progress = getAnalysisProgress(analysisData);
  const status = analysisData?.status;
  const isStarted = status === 'STARTED';
  const isPending = status === 'PENDING' || status === 'Conflict';
  const isSingleStep = progress.isSingleStep;
  const showProgressBar = isStarted && progress.hasSteps && !isSingleStep;
  const showSpinner =
    isPending ||
    !analysisData ||
    (isStarted && (isSingleStep || !progress.hasSteps));
  const showFallbackSpinner = Boolean(analysisData) && !showSpinner && !showProgressBar;

  let statusLabel;
  if (isStarted && progress.hasSteps && !isSingleStep) {
    statusLabel = progress.stageLabel;
  } else if (isStarted) {
    statusLabel = i18next.t('ai-quote-analysis-working');
  } else if (isPending || !analysisData) {
    statusLabel = i18next.t('ai-quote-analysis-status-pending');
  } else {
    statusLabel = i18next.t('ai-quote-analysis-status-loading');
  }

  const progressLineValue = progress.hasSteps ? progress.percent : undefined;

  return (
    <Box sx={{ width: '100%' }}>
      {showProgressBar && (
        <AppLinearProgress
          value={progressLineValue}
          barColor={barColor}
          sx={{ mt: 1 }}
        />
      )}
      {(showSpinner || showFallbackSpinner) && (
        <Box
          sx={{
            mt: showProgressBar ? 1.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
          }}
        >
          <CircularProgress size={16} sx={{ color: barColor }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {statusLabel}
          </Typography>
        </Box>
      )}
      {!showSpinner && showProgressBar && (
        <Box
          sx={{
            mt: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {statusLabel}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {`${progress.percent}%`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AnalysisJobProgress;
