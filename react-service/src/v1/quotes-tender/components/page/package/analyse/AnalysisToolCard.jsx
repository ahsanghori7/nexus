import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import i18next from 'v2/helpers/i18n';
import adminColors from 'v2/constants/colors';
import AnalysisJobProgress from './AnalysisJobProgress';
import AnalysisToolCardSkeleton from './AnalysisToolCardSkeleton';

const { clinkGreen } = adminColors;

const {
  aiToolNotRunChipBg,
  aiToolNotRunChipLabel,
  aiToolRunningChipBg,
  aiToolRunningChipLabel,
  aiToolReadyChipBg,
  aiToolReadyChipLabel,
  aiToolReadyDot,
  aiToolLevelingFailedBg,
  aiToolLevelingFailedBorder,
  aiToolLevelingFailedChipBg,
  aiToolLevelingFailedChipLabel,
  aiToolLevelingFailedDot,
  aiToolLevelingFailedMessage,
  aiToolLevelingRetryBg,
  aiToolCardBorder,
  aiAnalysisToolsBetaBg,
  aiAnalysisToolsBetaLabel,
  white,
} = adminColors;

const STATUS_CHIP_STYLES = {
  not_run: { bg: aiToolNotRunChipBg, color: aiToolNotRunChipLabel, labelKey: 'analysis-tool-status-not-run' },
  running: { bg: aiToolRunningChipBg, color: aiToolRunningChipLabel, labelKey: 'analysis-tool-status-running' },
  ready: { bg: aiToolReadyChipBg, color: aiToolReadyChipLabel, labelKey: 'analysis-tool-status-ready' },
  failed: { bg: aiToolLevelingFailedChipBg, color: aiToolLevelingFailedChipLabel, labelKey: 'analysis-tool-status-failed' },
};

const StatusChipWithDot = ({ labelKey, dotColor, bg, color }) => (
  <Chip
    label={
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: dotColor,
            flexShrink: 0,
          }}
        />
        {i18next.t(labelKey)}
      </Box>
    }
    size="small"
    sx={{
      height: 22,
      fontSize: 11,
      fontWeight: 600,
      bgcolor: bg,
      color,
      borderRadius: '999px',
      flexShrink: 0,
      '& .MuiChip-label': { px: 1.25 },
    }}
  />
);

const ReadyStatusChip = ({ labelKey }) => (
  <StatusChipWithDot
    labelKey={labelKey}
    dotColor={aiToolReadyDot}
    bg={aiToolReadyChipBg}
    color={aiToolReadyChipLabel}
  />
);

const DefaultStatusChip = ({ labelKey, bg, color }) => (
  <Chip
    label={i18next.t(labelKey)}
    size="small"
    sx={{
      height: 22,
      fontSize: 11,
      fontWeight: 600,
      bgcolor: bg,
      color,
      borderRadius: '999px',
      flexShrink: 0,
      '& .MuiChip-label': { px: 1.25 },
    }}
  />
);

const renderStatusChip = (status, chipStyle, failedChipProps) => {
  if (status === 'ready') {
    return <ReadyStatusChip labelKey={chipStyle.labelKey} />;
  }
  if (status === 'failed') {
    return <StatusChipWithDot labelKey={chipStyle.labelKey} {...failedChipProps} />;
  }
  return (
    <DefaultStatusChip
      labelKey={chipStyle.labelKey}
      bg={chipStyle.bg}
      color={chipStyle.color}
    />
  );
};

const AnalysisToolCard = ({
  title,
  beta = false,
  isLoading = false,
  status,
  description,
  readySummary,
  readyDescription,
  readyDescriptionEmphasis,
  readyFooter,
  onRun,
  onView,
  onRefresh,
  onRetry,
  onDownload,
  downloadLabelKey = 'analysis-tool-excel',
  progressData,
  errorView,
}) => {
  if (isLoading) {
    return <AnalysisToolCardSkeleton title={title} beta={beta} />;
  }

  const chipStyle = STATUS_CHIP_STYLES[status] || STATUS_CHIP_STYLES.not_run;
  const isFailedState = status === 'failed';
  const failedChipProps = {
    dotColor: aiToolLevelingFailedDot,
    bg: aiToolLevelingFailedChipBg,
    color: aiToolLevelingFailedChipLabel,
  };

  return (
    <Box
      sx={{
        border: `1px solid ${isFailedState ? aiToolLevelingFailedBorder : aiToolCardBorder}`,
        borderRadius: '12px',
        p: 2,
        bgcolor: isFailedState ? aiToolLevelingFailedBg : white,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</Typography>
        {beta && (
          <Chip
            label={i18next.t('beta-chip')}
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: aiAnalysisToolsBetaBg,
              color: aiAnalysisToolsBetaLabel,
              borderRadius: '999px',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}
        {renderStatusChip(status, chipStyle, failedChipProps)}
      </Box>

      {status === 'running' && (
        <>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
          <AnalysisJobProgress analysisData={progressData} barColor={clinkGreen} />
        </>
      )}

      {status === 'ready' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mt: 0.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {readySummary && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {readySummary}
              </Typography>
            )}
            {readyDescription && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mt: readySummary ? 0.5 : 0 }}>
                {readyDescription}
                {readyDescriptionEmphasis && (
                  <>
                    {' '}
                    <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                      {readyDescriptionEmphasis}
                    </Typography>
                  </>
                )}
              </Typography>
            )}
            {readyFooter && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontSize: '0.8125rem' }}
              >
                {readyFooter}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            {onRefresh && (
              <Tooltip title={i18next.t('analysis-tool-refresh-tooltip')} placement="top">
                <span>
                  <IconButton
                    size="small"
                    aria-label={i18next.t('analysis-tool-refresh')}
                    onClick={onRefresh}
                    sx={{
                      border: `1px solid ${aiToolCardBorder}`,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {onView && (
              <Button
                variant="contained"
                size="small"
                startIcon={<DescriptionOutlinedIcon />}
                onClick={onView}
                sx={{
                  bgcolor: clinkGreen,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  '&:hover': { bgcolor: clinkGreen },
                }}
              >
                {i18next.t('analysis-tool-view')}
              </Button>
            )}
            {onDownload && (
              <Button
                variant="contained"
                size="small"
                startIcon={<TableViewOutlinedIcon />}
                onClick={onDownload}
                sx={{
                  bgcolor: clinkGreen,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  '&:hover': { bgcolor: clinkGreen },
                }}
              >
                {i18next.t(downloadLabelKey)}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {status === 'not_run' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mt: 0.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {description}
              </Typography>
            )}
          </Box>
          {onRun && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={onRun}
              sx={{
                borderColor: clinkGreen,
                color: clinkGreen,
                textTransform: 'none',
                fontWeight: 600,
                flexShrink: 0,
                px: 2,
                '&:hover': {
                  borderColor: clinkGreen,
                  bgcolor: 'rgba(13, 148, 136, 0.04)',
                },
              }}
            >
              {i18next.t('analysis-tool-run')}
            </Button>
          )}
        </Box>
      )}

      {status === 'failed' && errorView && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mt: 0.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {errorView?.primaryMessage && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: aiToolLevelingFailedMessage,
                }}
              >
                {errorView.primaryMessage}
              </Typography>
            )}
            {errorView?.suggestions?.length > 0 && (
              <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2.5 }}>
                {errorView.suggestions.map((suggestion) => (
                  <Typography
                    component="li"
                    variant="body2"
                    color="text.secondary"
                    key={suggestion}
                    sx={{ lineHeight: 1.5 }}
                  >
                    {suggestion}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
          {onRetry && (
            <Button
              variant="contained"
              size="small"
              startIcon={<ReplayIcon />}
              onClick={onRetry}
              sx={{
                bgcolor: aiToolLevelingRetryBg,
                textTransform: 'none',
                fontWeight: 600,
                flexShrink: 0,
                px: 2,
                '&:hover': {
                  bgcolor: aiToolLevelingRetryBg,
                },
              }}
            >
              {i18next.t('analysis-tool-try-again')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AnalysisToolCard;
