import React, { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid2 from '@mui/material/Grid2';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import { useContext } from 'v2/hooks/context';
import adminColors from 'v2/constants/colors';
import PanelAccordion from 'v1/global/components/layout/panel/PanelAccordion';
import {
  QUOTE_LEVELING,
  selectPackageJob,
  readAnalysisStarted,
  setCurrentTender,
  setTenderAnalysisData,
} from 'v2/store/reducers/clink/analyse-quote';
import AIBanner from './AIBanner';
import AIInfoTooltip from './AIInfoTooltip';
import AnalysisToolCard from './AnalysisToolCard';
import TenderAnalysisToolCard from './TenderAnalysisToolCard';
import getAnalysisJobStatus from './getAnalysisJobStatus';
import getAnalysisErrorView from './getAnalysisErrorView';
import useAnalysisJob from './useAnalysisJob';
import usePackageAnalysisJob from './usePackageAnalysisJob';
import downloadAnalysisExport from './downloadAnalysisExport';
import buildLevelingReadyContent from './buildLevelingReadyContent';
import buildQuoteAnalysisSummaryModalNavTitle from './buildQuoteAnalysisSummaryModalNavTitle';
import useConfirmAnalysisRerun from './useConfirmAnalysisRerun';
import AnalysisRerunConfirmModal from './AnalysisRerunConfirmModal';
import shouldInitiateAnalysis from './shouldInitiateAnalysis';
import { isInProgressJobStatus } from './packageJobScope';

const {
  aiAnalysisToolsBetaBg,
  aiAnalysisToolsBetaLabel,
  aiAnalysisToolsPanelBorder,
  aiIneligibleChipLabel,
  white,
} = adminColors;

const POLL_SECONDS = 10;

/** Scoped to Analysis Tools only — does not affect other PanelAccordion usages. */
const analysisToolsPanelSx = {
  px: 2,
  pb: 1,
  '& > .MuiAccordion-root': {
    boxShadow: 'none',
    border: `1px solid ${aiAnalysisToolsPanelBorder}`,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: white,
    '&::before': {
      display: 'none',
    },
  },
  '& .MuiAccordionSummary-root': {
    minHeight: 48,
    paddingLeft: '12px',
    paddingRight: '16px',
    flexDirection: 'row-reverse',
    overflow: 'visible',
    '& .MuiAccordionSummary-expandIconWrapper': {
      alignSelf: 'center',
      marginTop: '0 !important',
      marginRight: '8px',
      marginLeft: 0,
      color: aiIneligibleChipLabel,
    },
    '& .MuiAccordionSummary-content': {
      margin: 0,
      width: '100%',
      alignItems: 'center',
      overflow: 'visible',
    },
  },
  '& .MuiAccordionDetails-root': {
    paddingTop: 0,
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
};

const isAnalysisToolsBannerVisible = (tid) => {
  const existingData = JSON.parse(localStorage.getItem('analyseQuote')) || [];
  return !existingData.includes(tid);
};

const AnalysisJobCard = ({
  tid,
  type,
  title,
  beta,
  analysis,
  dispatch,
  useModal,
  hasMoreThanFiveQuotes,
  quoteCount,
  runningDescriptionKey,
  notRunDescriptionKey,
  onView,
  onDownload,
  downloadLabelKey,
  showRefreshOnReady = true,
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const [, setOpen] = useModal || [false, () => {}];

  const { error, errorPayload, seconds } = selectPackageJob(analysis, tid, type);
  const [isStarting, setIsStarting] = useState(false);
  const startInFlightRef = useRef(false);
  const { packageData, isHydrating } = usePackageAnalysisJob({
    tid,
    type: QUOTE_LEVELING,
    dispatch,
    analysis,
    suspendFetch: isStarting || startInFlightRef.current,
  });
  const {
    confirmOpen,
    requestRerun,
    handleClose: handleConfirmClose,
    handleConfirm: handleConfirmRerun,
  } = useConfirmAnalysisRerun();
  const analysisStarted = readAnalysisStarted(tid, type);
  const resolvedStatus = getAnalysisJobStatus({
    tid,
    data: packageData,
    error,
    analysisStarted,
    errorPayload,
    seconds,
  });
  const isLoading = isHydrating && !isStarting && resolvedStatus === 'not_run';
  const status = isStarting ? 'running' : resolvedStatus;
  const isRunning = status === 'running';
  let progressData = null;
  if (isRunning) {
    progressData =
      isStarting || !isInProgressJobStatus(packageData?.status)
        ? { status: 'PENDING', package_id: tid }
        : packageData;
  }

  useAnalysisJob({
    tid,
    type: QUOTE_LEVELING,
    enabled: isRunning && !isStarting,
    seconds,
    dispatch,
  });

  const openAiWarningModal = useCallback(() => {
    setOpen({
      id: 'ai-warning',
      navTitle: 'ai-warning',
      children: i18next.t('ai-warning-text'),
      backdropClick: true,
    });
  }, [setOpen]);

  const startJob = useCallback(
    (reset = false) => {
      if (hasMoreThanFiveQuotes) {
        openAiWarningModal();
        return Promise.resolve(undefined);
      }

      dispatch(actions.setCurrentTender(tid));
      startInFlightRef.current = true;
      setIsStarting(true);
      dispatch(actions.clearJobError({ type: QUOTE_LEVELING, tid }));
      dispatch(actions.setSeconds({ seconds: -1, type: QUOTE_LEVELING, tid }));

      const finishStart = () => {
        startInFlightRef.current = false;
        setIsStarting(false);
      };

      const skipCheck = reset;
      if (shouldInitiateAnalysis({ reset: skipCheck, packageData, tid })) {
        return dispatch(
          actions.analyseStart({ tid, type: QUOTE_LEVELING, reset: skipCheck }),
        )
          .then((e) => {
            if (e.type !== 'ai/analyseStart/rejected') {
              return dispatch(actions.analyseFetch({ tid, type: QUOTE_LEVELING })).then(
                () =>
                  dispatch(
                    actions.setSeconds({
                      seconds: POLL_SECONDS,
                      type: QUOTE_LEVELING,
                      tid,
                    }),
                  ),
              );
            }
            return e;
          })
          .finally(finishStart);
      }
      return dispatch(actions.analyseFetch({ tid, type: QUOTE_LEVELING }))
        .then(() =>
          dispatch(
            actions.setSeconds({ seconds: POLL_SECONDS, type: QUOTE_LEVELING, tid }),
          ),
        )
        .finally(finishStart);
    },
    [
      hasMoreThanFiveQuotes,
      openAiWarningModal,
      dispatch,
      actions,
      tid,
      packageData,
    ],
  );

  const handleRun = useCallback(
    (e) => {
      e?.preventDefault?.();
      startJob(false);
    },
    [startJob],
  );

  const handleRefresh = useCallback(
    (e) => {
      e?.preventDefault?.();
      requestRerun(() => startJob(true));
    },
    [requestRerun, startJob],
  );

  const handleRetry = useCallback(
    (e) => {
      e?.preventDefault?.();
      requestRerun(() => startJob(true));
    },
    [requestRerun, startJob],
  );

  const normalizedError = getAnalysisErrorView({
    status: resolvedStatus,
    packageData,
    error,
    errorPayload,
  });

  const descriptionParams = { count: quoteCount };
  let description;
  if (status === 'not_run' && notRunDescriptionKey) {
    description = i18next.t(notRunDescriptionKey, descriptionParams);
  } else if (status === 'running' && runningDescriptionKey) {
    description = i18next.t(runningDescriptionKey, descriptionParams);
  }

  const levelingReadyContent =
    status === 'ready' && packageData
      ? buildLevelingReadyContent(packageData, quoteCount)
      : null;

  return (
    <>
    <AnalysisToolCard
      title={title}
      beta={beta}
      isLoading={isLoading}
      status={status}
      description={description}
      readyDescription={levelingReadyContent?.description}
      readyDescriptionEmphasis={levelingReadyContent?.descriptionEmphasis}
      readyFooter={levelingReadyContent?.footer}
      progressData={progressData}
      errorView={normalizedError}
      onRun={handleRun}
      onView={status === 'ready' ? onView : undefined}
      onRefresh={status === 'ready' && showRefreshOnReady ? handleRefresh : undefined}
      onRetry={status === 'failed' ? handleRetry : undefined}
      onDownload={status === 'ready' ? onDownload : undefined}
      downloadLabelKey={downloadLabelKey}
    />
    <AnalysisRerunConfirmModal
      open={confirmOpen}
      onClose={handleConfirmClose}
      onConfirm={handleConfirmRerun}
    />
    </>
  );
};

const AnalysisToolsPanel = ({
  tid,
  label,
  aiState,
  reasons,
  analysis,
  dispatch,
  useModal,
  hasMoreThanFiveQuotes,
  quoteCount = 0,
}) => {
  const [, setOpen] = useModal || [false, () => {}];

  const openAiWarningModal = useCallback(() => {
    setOpen({
      id: 'ai-warning',
      navTitle: 'ai-warning',
      children: i18next.t('ai-warning-text'),
      backdropClick: true,
    });
  }, [setOpen]);

  const openTenderResults = useCallback(
    (tenderData) => {
      dispatch(setCurrentTender(tid));
      if (tenderData?.status === 'SUCCESS') {
        dispatch(setTenderAnalysisData(tenderData));
      }
      setOpen({
        id: 'analyse-quote-with-ai',
        packageId: tid,
        analysisData: tenderData,
        ...buildQuoteAnalysisSummaryModalNavTitle(label),
        description: 'ai-quote-analysis-complete-description',
        backdropClick: true,
      });
    },
    [setOpen, label, dispatch, tid],
  );

  const showEligibilityBanner = aiState !== 'eligible';
  const showBanner = showEligibilityBanner || isAnalysisToolsBannerVisible(tid);
  const title = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 2,
        pr: 0.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          {i18next.t('analysis-tools-title')}
        </Typography>
        <Chip
          label={i18next.t('beta-chip')}
          size="small"
          sx={{
            height: 22,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: aiAnalysisToolsBetaBg,
            color: aiAnalysisToolsBetaLabel,
            borderRadius: '999px',
            '& .MuiChip-label': { px: 1.25, py: 0 },
          }}
        />
      </Box>
      <Box sx={{ flexShrink: 0, ml: 'auto' }}>
        <AIInfoTooltip aiState={aiState} reasons={reasons} variant="limitations" />
      </Box>
    </Box>
  );

  return (
    <Box className="analysis-tools-panel" sx={analysisToolsPanelSx}>
      <PanelAccordion title={title} defaultExpanded>
        {showBanner && (
          <AIBanner
            aiState={aiState}
            tid={tid}
            reasons={reasons}
            showBetaChip={false}
            embedded
            showTooltipTrigger={aiState !== 'eligible'}
          />
        )}
        {aiState === 'eligible' && (
          <Grid2 container spacing={2} sx={{ mt: showBanner ? 1 : 0 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TenderAnalysisToolCard
                tid={tid}
                title={i18next.t('analysis-tool-tender-title')}
                analysis={analysis}
                dispatch={dispatch}
                hasMoreThanFiveQuotes={hasMoreThanFiveQuotes}
                quoteCount={quoteCount}
                notRunDescriptionKey="analysis-tool-tender-not-run"
                runningDescriptionKey="analysis-tool-tender-running"
                onView={openTenderResults}
                onOpenAiWarning={openAiWarningModal}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <AnalysisJobCard
                tid={tid}
                type={QUOTE_LEVELING}
                title={i18next.t('analysis-tool-leveling-title')}
                beta
                analysis={analysis}
                dispatch={dispatch}
                useModal={useModal}
                hasMoreThanFiveQuotes={hasMoreThanFiveQuotes}
                quoteCount={quoteCount}
                notRunDescriptionKey="analysis-tool-leveling-not-run"
                runningDescriptionKey="analysis-tool-leveling-running"
                downloadLabelKey="analysis-tool-excel"
                onDownload={() =>
                  downloadAnalysisExport(tid, 'csv', QUOTE_LEVELING)
                }
              />
            </Grid2>
          </Grid2>
        )}
      </PanelAccordion>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  analysis: state.analysis,
});

export default connect(mapStateToProps)(AnalysisToolsPanel);
export { isAnalysisToolsBannerVisible };
