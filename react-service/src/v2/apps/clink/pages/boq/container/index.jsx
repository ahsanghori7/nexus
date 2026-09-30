import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import { useContext } from 'hooks/context';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import { Item } from 'v2/apps/clink/pages/tender-analysis/styled/mui';
import { updateFunc } from 'v2/apps/clink/pages/boq/upload';
import Content from 'v2/apps/clink/pages/boq/content';
import SmartBoqBuilderCard from 'v2/apps/clink/pages/boq/smart-builder/SmartBoqBuilderCard';
import StartFromScratchCard from 'v2/apps/clink/pages/boq/start-from-scratch/StartFromScratchCard';
import {
  fetchGenerateBoqStatus,
} from 'v2/store/reducers/common/boq';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import { cardItemProps, creationCardPaperProps, Container as ContainerMui } from './containerStyles';
import { selectBoqUiLoadingFlags } from 'v2/apps/clink/pages/boq/selectBoqUiLoadingFlags';
import { shouldFetchAiGenerateBoqStatus } from 'v2/apps/clink/pages/boq/boqAiRehydration';
import {
  AI_LIFECYCLE_STATUS,
  isAiLifecycleFailure,
  normalizeAiLifecycleStatus,
} from 'v2/apps/clink/pages/boq/boqAiStatus';

// Skip duplicate rehydration GETs while a request is in flight (e.g. parent re-render
// remounts before the first response lands).
const rehydrationInFlight = new Set();

export { buildGenerateBoqFormData, normalizeSelectedSheets } from 'v2/apps/clink/pages/boq/buildGenerateBoqFormData';

const Container = ({
  entity = null,
  slug = '',
  contextType = 'clink',
  theme = {},
  boq,
  dispatch,
  enable = false,
  onOpenSmartBoqBuilder = () => null,
}) => {
  const { showSnackbar, closeSnackbar, snackbar } = useSnackbar();
  const context = useContext(contextType);
  const { actions } = context;

  const packageId = entity?.id;
  const getPollSticky = Boolean(
    packageId && boq?.aiGetPollStickyById?.[packageId]
  );
  const knownAiStatus = normalizeAiLifecycleStatus(
    boq?.aiGenerationById?.[packageId]?.status
  );
  const skipAiRehydration = Boolean(
    boq?.aiRehydrationSkippedById?.[packageId]
  );

  const aiStatus = boq?.aiGenerationById?.[packageId];
  const {
    isBoqListLoading,
    isAiPollLoading,
    isEntityUpdating,
    isNewBoqResetting,
    isBoqCreationBusy,
  } = selectBoqUiLoadingFlags(boq, packageId);
  const aiLifecycleStatus = normalizeAiLifecycleStatus(aiStatus?.status);
  const isAiInProgress =
    aiLifecycleStatus === AI_LIFECYCLE_STATUS.PENDING ||
    aiLifecycleStatus === AI_LIFECYCLE_STATUS.STARTED;
  const disableCardActions = isBoqCreationBusy || isAiInProgress;
  const isAiSuccess = aiLifecycleStatus === AI_LIFECYCLE_STATUS.SUCCESS;
  const isAiError = aiLifecycleStatus === AI_LIFECYCLE_STATUS.ERROR;
  const isAiFailure = isAiLifecycleFailure(aiLifecycleStatus);
  const hasPersistedEntries = Boolean(entity?.entries?.length);
  const hasDraftEntries = Boolean(entity?.nextEntries?.length);
  const hasAiPreviewResult = Boolean(aiStatus?.result);
  const showBoqContentView =
    hasPersistedEntries ||
    hasDraftEntries ||
    isAiInProgress ||
    (isAiSuccess && hasAiPreviewResult) ||
    isAiError ||
    isAiFailure;
  const forceCardsView = Boolean(enable && isNewBoqResetting);
  // When a user is creating a BoQ (Start from scratch), prefer switching to the grid and show grid skeleton.
  // New BoQ reset is special: it should stay on cards skeleton.
  const forceContentView = Boolean(enable && isEntityUpdating && !isNewBoqResetting);
  let effectiveShowBoqContentView = showBoqContentView;
  if (forceCardsView) effectiveShowBoqContentView = false;
  else if (forceContentView) effectiveShowBoqContentView = true;

  const showCardsSkeleton =
    enable &&
    !effectiveShowBoqContentView &&
    (isBoqListLoading || isAiPollLoading || isNewBoqResetting || isEntityUpdating);

  const shouldFetchAiStatus = shouldFetchAiGenerateBoqStatus({
    packageId,
    entity,
    aiGenerationById: boq?.aiGenerationById,
    skipAiRehydration,
  });
  const isSuccessAwaitingResult =
    knownAiStatus === AI_LIFECYCLE_STATUS.SUCCESS && !hasAiPreviewResult;
  const packageUiResolved =
    effectiveShowBoqContentView ||
    !shouldFetchAiStatus ||
    (Boolean(knownAiStatus) && !isSuccessAwaitingResult);
  const isAiStatusLoading = Boolean(
    isAiPollLoading ||
      (shouldFetchAiStatus && (!knownAiStatus || isSuccessAwaitingResult))
  );

  // Covers both the initial render (before the thunk reaches pending) and the
  // actual GET pending state. It clears on the request's fulfilled/rejected
  // reducer, which records a known lifecycle status for this package.
  const showGeneralAiSkeleton = Boolean(
    enable &&
      !packageUiResolved &&
      isAiStatusLoading &&
      !isBoqListLoading &&
      !isEntityUpdating &&
      !isNewBoqResetting
  );
  useEffect(() => {
    if (!enable) return;
    if (!shouldFetchAiStatus) return;
    // Content polls after POST; avoid an immediate rehydration GET on the grid.
    if (isAiInProgress && effectiveShowBoqContentView) return;
    if (rehydrationInFlight.has(packageId)) return;
    rehydrationInFlight.add(packageId);
    Promise.resolve(dispatch(fetchGenerateBoqStatus({ packageId }))).finally(
      () => {
        rehydrationInFlight.delete(packageId);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enable,
    packageId,
    shouldFetchAiStatus,
    entity?.entries?.length,
    entity?.nextEntries?.length,
    knownAiStatus,
    hasAiPreviewResult,
    skipAiRehydration,
    dispatch,
    isAiInProgress,
    effectiveShowBoqContentView,
  ]);

  /** GET ai/generate-boq failed: only remind on the two-card screen (Smart Builder / Start from scratch), not on the grid. */
  const aiUnavailableSnackbarMessage = i18next.t('boq-ai-get-500-snackbar');
  const shouldRemindAiGetPollFailure = Boolean(
    enable && getPollSticky && !showBoqContentView
  );
  useEffect(() => {
    if (!enable || !packageId || !getPollSticky || showBoqContentView) return;
    showSnackbar(aiUnavailableSnackbarMessage, 'warning', {
      autoHideDuration: 8000,
    });
  }, [
    enable,
    packageId,
    getPollSticky,
    showBoqContentView,
    showSnackbar,
    aiUnavailableSnackbarMessage,
  ]);

  // Tab panels stay mounted (display:none). Inactive tabs have enable=false; they must not close the snackbar
  // opened by the active cards tab. Only the visible tab dismisses when it no longer should remind.
  useEffect(() => {
    if (!enable || shouldRemindAiGetPollFailure) return;
    if (
      snackbar.open &&
      snackbar.message === aiUnavailableSnackbarMessage
    ) {
      closeSnackbar();
    }
  }, [
    enable,
    shouldRemindAiGetPollFailure,
    snackbar.open,
    snackbar.message,
    closeSnackbar,
    aiUnavailableSnackbarMessage,
  ]);

  const dispatchFunc = (excel) => (currentEntity, data) => {
    const newData = {
      ...data,
      entries: data.entries.map((e) => ({
        ...e,
        budget_rate: Number(e.budget_rate),
        budget_total: Number(e.budget_total),
        quantity: Number(e.quantity),
      })),
    };
    return dispatch(
      actions.updateEntity({ id: currentEntity.id, data: newData })
    )
      .then(() =>
        dispatch(
          actions.fetchBoQList({
            slug,
            releaseBusyForPackageId: currentEntity.id,
          })
        )
      )
      .then(() =>
        dispatch(
          actions.setEditingMode({ id: currentEntity.id, value: true, excel })
        )
      );
  };
  const handleStartFromScratch = (excel = false) =>
    updateFunc(entity, dispatchFunc(excel));

  let body = null;
  if (effectiveShowBoqContentView) {
    body = (
      <Content
        contextType={contextType}
        entity={entity}
        theme={theme}
        slug={slug}
        enable={enable}
      />
    );
  } else if (showGeneralAiSkeleton) {
    body = (
      <Box data-testid="boq-ai-page-skeleton" sx={{ px: 0, py: 2 }}>
        <Skeleton
          variant="rectangular"
          height={56}
          sx={{ borderRadius: '12px', mb: 2 }}
        />
        <Skeleton
          variant="rectangular"
          height={520}
          sx={{ borderRadius: '12px' }}
        />
      </Box>
    );
  } else if (showCardsSkeleton) {
    body = (
      <>
        <Item itemProps={cardItemProps} paperProps={creationCardPaperProps}>
          <Skeleton
            variant="rectangular"
            height={250}
            sx={{ borderRadius: '12px' }}
          />
        </Item>
        <Item itemProps={cardItemProps} paperProps={creationCardPaperProps}>
          <Skeleton
            variant="rectangular"
            height={250}
            sx={{ borderRadius: '12px' }}
          />
        </Item>
      </>
    );
  } else {
    body = (
      <>
        <Item itemProps={cardItemProps} paperProps={creationCardPaperProps}>
          <SmartBoqBuilderCard
            onOpen={() => onOpenSmartBoqBuilder(entity)}
            disabled={disableCardActions}
          />
        </Item>
        <Item itemProps={cardItemProps} paperProps={creationCardPaperProps}>
          <StartFromScratchCard
            onStart={handleStartFromScratch(false)}
            disabled={disableCardActions}
          />
        </Item>
      </>
    );
  }

  if (!enable) return null;

  // Content owns the DataGrid layout. Wrapping it in the cards Grid container
  // can collapse the panel while the selected package changes.
  if (effectiveShowBoqContentView) {
    return <Box sx={{ width: '100%' }}>{body}</Box>;
  }

  return <ContainerMui>{body}</ContainerMui>;
};

const mapStateToProps = (state) => {
  return {
    boq: state.boq,
  };
};

export default connect(mapStateToProps)(Container);
