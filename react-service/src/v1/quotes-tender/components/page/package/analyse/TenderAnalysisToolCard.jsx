import React, { useCallback, useEffect, useRef, useState } from 'react';
import i18next from 'v2/helpers/i18n';
import { useContext } from 'v2/hooks/context';
import { readAnalysisStarted, selectPackageJob } from 'v2/store/reducers/clink/analyse-quote';
import AnalysisToolCard from './AnalysisToolCard';
import getTenderAnalysisCardStatus from './getTenderAnalysisCardStatus';
import { isInProgressJobStatus } from './packageJobScope';
import getAnalysisErrorView from './getAnalysisErrorView';
import useTenderAnalysisPoll from './useTenderAnalysisPoll';
import usePackageAnalysisJob from './usePackageAnalysisJob';
import buildTenderReadyContent from './buildTenderReadyContent';
import useConfirmAnalysisRerun from './useConfirmAnalysisRerun';
import AnalysisRerunConfirmModal from './AnalysisRerunConfirmModal';
import shouldInitiateAnalysis from './shouldInitiateAnalysis';

const POLL_SECONDS = 10;

const TenderAnalysisToolCard = ({
  tid,
  title,
  analysis,
  dispatch,
  hasMoreThanFiveQuotes,
  quoteCount,
  notRunDescriptionKey,
  runningDescriptionKey,
  onView,
  onOpenAiWarning,
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const { currentTender } = analysis;
  const { error, errorPayload, seconds } = selectPackageJob(analysis, tid);
  const analysisStarted = readAnalysisStarted(tid);
  const [isStarting, setIsStarting] = useState(false);
  const startInFlightRef = useRef(false);
  const { packageData, isHydrating } = usePackageAnalysisJob({
    tid,
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
  const resolvedStatus = getTenderAnalysisCardStatus({
    tid,
    data: packageData,
    error,
    analysisStarted,
    errorPayload,
    seconds,
  });
  const isLoading = isHydrating && !isStarting && resolvedStatus === 'not_run';
  const status = isStarting ? 'running' : resolvedStatus;
  const showProgress = status === 'running';
  let progressData = null;
  if (showProgress) {
    progressData =
      isStarting || !isInProgressJobStatus(packageData?.status)
        ? { status: 'PENDING', package_id: tid }
        : packageData;
  }

  useTenderAnalysisPoll({
    tid,
    seconds,
    dispatch,
    enabled: !isStarting && showProgress,
  });

  useEffect(() => {
    if (
      !dispatch ||
      isStarting ||
      !packageData ||
      !isInProgressJobStatus(packageData.status)
    ) {
      return undefined;
    }
    if (Number(tid) !== Number(currentTender)) {
      dispatch(actions.setCurrentTender(tid));
    }
    if (seconds < 0) {
      dispatch(actions.setSeconds({ seconds: POLL_SECONDS, tid }));
    }
    return undefined;
  }, [dispatch, actions, tid, currentTender, packageData, seconds, isStarting]);

  const startTenderAnalysis = useCallback(
    (reset = false) => {
      if (hasMoreThanFiveQuotes) {
        onOpenAiWarning();
        return Promise.resolve(undefined);
      }

      dispatch(actions.setCurrentTender(tid));
      startInFlightRef.current = true;
      setIsStarting(true);
      dispatch(actions.clearJobError({ tid }));
      dispatch(actions.setSeconds({ seconds: -1, tid }));

      const finishStart = () => {
        startInFlightRef.current = false;
        setIsStarting(false);
      };

      if (shouldInitiateAnalysis({ reset, packageData, tid })) {
        return dispatch(actions.analyseStart({ tid, reset }))
          .then((e) => {
            if (e.type !== 'ai/analyseStart/rejected') {
              return dispatch(actions.analyseFetch({ tid })).then((fetchResult) => {
                dispatch(actions.setSeconds({ seconds: POLL_SECONDS, tid }));
                return fetchResult;
              });
            }
            return e;
          })
          .finally(finishStart);
      }
      return dispatch(actions.analyseFetch({ tid }))
        .then((fetchResult) => {
          dispatch(actions.setSeconds({ seconds: POLL_SECONDS, tid }));
          return fetchResult;
        })
        .finally(finishStart);
    },
    [
      hasMoreThanFiveQuotes,
      onOpenAiWarning,
      dispatch,
      actions,
      tid,
      packageData,
    ],
  );

  const handleRun = useCallback(
    (e) => {
      e?.preventDefault?.();
      startTenderAnalysis(false);
    },
    [startTenderAnalysis],
  );

  const handleRefresh = useCallback(
    (e) => {
      e?.preventDefault?.();
      requestRerun(() => startTenderAnalysis(true));
    },
    [requestRerun, startTenderAnalysis],
  );

  const handleRetry = useCallback(
    (e) => {
      e?.preventDefault?.();
      requestRerun(() => startTenderAnalysis(true));
    },
    [requestRerun, startTenderAnalysis],
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

  const readyContent =
    status === 'ready' && packageData
      ? buildTenderReadyContent(packageData, quoteCount)
      : null;

  return (
    <>
    <AnalysisToolCard
      title={title}
      isLoading={isLoading}
      status={status}
      description={description}
      readySummary={readyContent?.summary}
      readyFooter={readyContent?.footer}
      progressData={progressData}
      errorView={normalizedError}
      onRun={handleRun}
      onView={status === 'ready' && packageData ? () => onView(packageData) : undefined}
      onRefresh={status === 'ready' ? handleRefresh : undefined}
      onRetry={status === 'failed' ? handleRetry : undefined}
    />
    <AnalysisRerunConfirmModal
      open={confirmOpen}
      onClose={handleConfirmClose}
      onConfirm={handleConfirmRerun}
    />
    </>
  );
};

export default TenderAnalysisToolCard;
