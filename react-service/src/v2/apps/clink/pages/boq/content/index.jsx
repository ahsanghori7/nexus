import React, { useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'lodash/isEqual';
import i18next from 'i18next';
import { connect } from 'react-redux';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { CONSTANTS } from 'clink-components';
import { useContext } from 'hooks/context';
import {
  fetchGenerateBoqStatus,
  clearAiGenerationResult,
  clearAiGenerationForPackage,
} from 'v2/store/reducers/common/boq';
import DataGrid from 'v2/apps/shared/components/boq/data-grid';
import columnsGrid from 'v2/apps/shared/components/boq/ClinkConfig';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import Wrapper from './Wrapper';
import {
  boqContentHeaderActionsSx,
  boqEditButtonSx,
  boqNewButtonSx,
  boqSaveButtonSx,
  boqPublishButtonSx,
  boqAiInlineAlertBannerSx,
  boqAiInlineAlertIconBoxSx,
  boqAiInlineAlertTextColSx,
  boqAiInlineAlertTitleTypographySx,
  boqAiInlineAlertBodyTypographySx,
  boqAiServiceErrorPanelWrapperSx,
  boqAiServiceErrorCardSx,
  boqAiServiceErrorIconCircleSx,
  boqAiServiceErrorTextColSx,
  boqAiServiceErrorBadgeSx,
  boqAiServiceErrorTitleTypographySx,
  boqAiServiceErrorSubtitleTypographySx,
  boqAiServiceErrorSuggestionsHeadingSx,
  boqAiServiceErrorSuggestionsListSx,
  boqAiServiceErrorSuggestionsWrapSx,
  boqAiServiceErrorRetryRowSx,
  boqAiServiceErrorRetryButtonSx,
  getBoqContentDataGridSx,
  inputBaseSx,
  modalSx,
  newBoqModalCancelSx,
  newBoqModalAcceptSx,
  newBoqModalTitleSx,
  saveModalCancelSx,
  saveModalAcceptSx,
} from './style';
import { selectBoqUiLoadingFlags } from 'v2/apps/clink/pages/boq/selectBoqUiLoadingFlags';
import Footer from './Footer';
import NoteTextarea from './NoteTextarea';
import {
  buildBoqEntityUpdatePayload,
  buildNewBoqUpdatePayload,
  mapAiResultEntriesToBoqDraftRows,
  mapAiNoteToDraft,
  shouldShowBoqEditButton,
} from 'v2/apps/clink/pages/boq/boqEntityPayload';
import {
  estimateBoqRowHeight,
} from 'v2/apps/shared/components/boq/boqLineText';
import {
  AI_LIFECYCLE_STATUS,
  isAiLifecycleFailure,
  normalizeAiLifecycleStatus,
} from 'v2/apps/clink/pages/boq/boqAiStatus';

const ITEM = 'item';
const SECTION = 'section';
const GROUPED_HEADING = 'grouped_heading';
const DELETE_STATUS = 4;
const AI_POLL_INITIAL_DELAY_MS = 1000;
const AI_POLL_INTERVAL_MS = 5000;
const sectionAcceptedColumns = ['actions'];
const acceptedColumns = [
  '__reorder__',
  'item_no',
  'description',
  ...sectionAcceptedColumns,
];

const Content = ({
  boq,
  contextType = 'clink',
  slug = '',
  entity,
  theme = {},
  dispatch,
  enable = false,
}) => {
  const context = useContext(contextType);
  const [open, setOpen] = useState(false);
  const [openSave, setOpenSave] = useState(false);
  const [openRepublish, setOpenRepublish] = useState(false);
  const [reasonMessage, setReasonMessage] = useState('');

  const { actions } = context;
  const { units, projectStatuses, readyAfterTemplate } = boq;
  const {
    entries = [],
    nextEntries = [],
    id,
    has_published_version,
    editing,
    nextNote,
    saved,
    has_enquiry,
  } = entity;

  const {
    boqAccent,
    boqSectionBg,
    borderbox,
    clinkLightPurple,
    eerieBlack,
    darkCharcoal,
    white,
    black,
    clinkRed,
  } = CONSTANTS.colors.general;

  const packageId = id;
  const aiStatus = boq?.aiGenerationById?.[packageId];
  const {
    isBoqListLoading,
    isAiPollLoading,
    isEntityUpdating,
    isNewBoqResetting,
    isPublishing,
    isBoqCreationBusy,
  } = selectBoqUiLoadingFlags(boq, packageId);
  const showBoqGridSkeleton = Boolean(
    enable &&
      (isBoqListLoading ||
        isAiPollLoading ||
        isPublishing ||
        (isEntityUpdating && !isNewBoqResetting))
  );
  const aiLifecycleStatus = normalizeAiLifecycleStatus(aiStatus?.status);
  const isAiInProgress =
    aiLifecycleStatus === AI_LIFECYCLE_STATUS.PENDING ||
    aiLifecycleStatus === AI_LIFECYCLE_STATUS.STARTED;
  const isAiNotFound = aiLifecycleStatus === AI_LIFECYCLE_STATUS.NOT_FOUND;
  const isSmartBoqInProgress = isAiInProgress;
  const headerActionsDisabled =
    isSmartBoqInProgress || isBoqCreationBusy || isPublishing;
  const isAiSuccess = aiLifecycleStatus === AI_LIFECYCLE_STATUS.SUCCESS;
  const isAiError = aiLifecycleStatus === AI_LIFECYCLE_STATUS.ERROR;
  /** GET ai/generate-boq: invalid/corrupt file returns `status: "FAILURE"`. */
  const isAiFailure = isAiLifecycleFailure(aiLifecycleStatus);
  /** Transport/POST failures (not FAILURE); full-page error when no saved rows. */
  const hasBoqTableRows = Boolean(entries?.length || nextEntries?.length);
  const isAiErrorBlockingBoq = isAiError && !hasBoqTableRows;

  const aiResultEntries = aiStatus?.result?.entries;
  const hasMeasurableItems =
    Array.isArray(aiResultEntries) &&
    aiResultEntries.some(
      (e) => String(e?.type || '').toLowerCase().trim() === 'item'
    );
  const isAiEmptyResult =
    isAiSuccess && Array.isArray(aiResultEntries) && !hasMeasurableItems;
  /** FAILURE or empty SUCCESS: header shows only New BoQ. */
  const isSmartBoqFailedResult = isAiFailure || isAiEmptyResult;

  const progressMeta = useMemo(() => {
    const total = Number(aiStatus?.total_steps || 0);
    const current = Number(aiStatus?.current_step || 0);
    const pct =
      total > 0 ? Math.min(100, Math.max(0, Math.floor((current / total) * 100))) : 0;
    return { total, current, pct };
  }, [aiStatus?.total_steps, aiStatus?.current_step]);

  const hasAppliedAiResultRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const isAiInProgressRef = useRef(isAiInProgress);
  const aiPollGenerationRef = useRef(boq?.aiPollGenerationById?.[packageId] ?? 0);
  isAiInProgressRef.current = isAiInProgress;
  aiPollGenerationRef.current = boq?.aiPollGenerationById?.[packageId] ?? 0;

  const stopAiPolling = () => {
    isAiInProgressRef.current = false;
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const label = has_published_version ? 'republished' : 'publish';
  const saveLabel = has_published_version
    ? 'boq-redraft-save-body'
    : 'boq-draft-save-body';

  const palette = theme ? theme.palette : {};

  const hasEntryChanges =
    entity?.nextEntries &&
    entity.entries &&
    !isEqual(entity.nextEntries, entity.entries);
  const hasNoteChanges = !isEqual(entity?.nextNote, entity?.note);

  const hasChanges = readyAfterTemplate || hasNoteChanges || hasEntryChanges;

  const totalPrice = nextEntries.reduce(
    (total, entry) =>
      entry.type === 'item'
        ? (Number(entry.budget_total) ||
          Number(entry.quantity) * Number(entry.budget_rate)) + total
        : total,
    0
  );

  useEffect(() => {
    if (!packageId || !isAiInProgress) {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return undefined;
    }
    if (entries?.length || isAiNotFound) return undefined;

    if (pollIntervalRef.current || pollTimeoutRef.current) return undefined;

    pollTimeoutRef.current = setTimeout(() => {
      pollTimeoutRef.current = null;
      const pollStatus = () => {
        if (!isAiInProgressRef.current) return;
        dispatch(
          fetchGenerateBoqStatus({
            packageId,
            pollGeneration: aiPollGenerationRef.current,
          })
        );
      };
      pollStatus();
      pollIntervalRef.current = setInterval(pollStatus, AI_POLL_INTERVAL_MS);
    }, AI_POLL_INITIAL_DELAY_MS);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [dispatch, packageId, isAiInProgress, entries?.length, isAiNotFound]);

  // On SUCCESS, load API result as draft preview; user saves via PATCH when ready
  useEffect(() => {
    const result = aiStatus?.result;
    if (!id || !isAiSuccess || !result || hasAppliedAiResultRef.current) return;
    if (isAiEmptyResult) return;
    hasAppliedAiResultRef.current = true;

    const previewEntries = mapAiResultEntriesToBoqDraftRows(result?.entries, {
      units,
    });
    const previewNote = mapAiNoteToDraft(result?.notes);

    dispatch(actions.setSelectedEntries({ id, rows: previewEntries }));
    dispatch(actions.setPackageNote({ eid: id, newNote: previewNote }));
    dispatch(actions.setEditingMode({ id, value: true, excel: true }));
    // We can clear AI result after we apply rows to draft.
    dispatch(clearAiGenerationResult({ packageId }));
  }, [
    dispatch,
    actions,
    id,
    isAiSuccess,
    aiStatus?.result,
    slug,
    units,
    packageId,
    isAiEmptyResult,
  ]);

  // Hack to make republish work
  useEffect(() => {
    if (!openRepublish && reasonMessage) {
      setOpen({
        id: 'boq-republish-enquiry-finished',
        navTitle: 'boq-republish-success-title',
        title: 'boq-republish-success-body',
        backdropClick: true,
      });
      setTimeout(() => {
        dispatch(actions.republishBoQ({ id, reason: reasonMessage }))
          .then(() => dispatch(actions.fetchBoQList(slug)))
          .then(() => {
            dispatch(actions.setEditingMode({ id, value: false }));
          });
      }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRepublish, reasonMessage]);

  const handleUpdateBoQ = () => {
    const data = buildBoqEntityUpdatePayload(nextNote, nextEntries, DELETE_STATUS);
    dispatch(actions.updateEntity({ id, data })).then(() =>
      dispatch(actions.fetchBoQList({ slug, releaseBusyForPackageId: id })).then(() => {
        dispatch(actions.setEditingMode({ id, value: true }));
        dispatch(actions.setEntitySaved({ eid: id, value: true }));
      })
    );
  };

  const handleNewBoq = () =>
    setOpen({
      id: 'new-boq',
      navTitle: 'new-boq-title',
      title: 'new-boq-question',
      cancel: 'cancel',
      confirm: 'confirm',
      backdropClick: true,
      handleAccept: () => {
        setOpen(false);
        stopAiPolling();
        dispatch(clearAiGenerationForPackage({ packageId }));
        const data = buildNewBoqUpdatePayload(nextNote, nextEntries, DELETE_STATUS);
        dispatch(actions.updateEntity({ id, data })).then(() =>
          dispatch(actions.fetchBoQList({ slug, releaseBusyForPackageId: id })).then(() => {
            dispatch(actions.setEditingMode({ id, value: true }));
            dispatch(actions.setEntitySaved({ eid: id, value: true }));
          })
        );
      },
    });

  const handleEdit = () =>
    setOpen({
      id: 'edit-bow',
      navTitle: 'boq-edit-warn-title',
      title: 'boq-edit-warn-body',
      cancel: 'cancel',
      confirm: 'confirm',
      backdropClick: true,
      handleAccept: () => {
        dispatch(actions.setEditingMode({ id, value: true }));
        dispatch(actions.setEntitySaved({ eid: id, value: false }));
        setOpen(false);
      },
    });

  const handlePublish = () => {
    if (has_published_version) {
      const cancel = 'cancel';
      const confirm = 'confirm';
      const backdropClick = true;
      let idModal = 'boq-publish';
      let navTitle = 'boq-republish-enquiry-title';
      let title = 'boq-republish-enquiry-body';
      let textArea = false;
      let handleAccept = () => {
        // Hide confirmation immediately; async work continues.
        setOpen(false);
        return dispatch(actions.republishBoQ({ id, reason: '' }))
          .then(() => dispatch(actions.fetchBoQList(slug)))
          .then(() => dispatch(actions.setEditingMode({ id, value: false })))
          .then(() => {
            setOpen(false);
          });
      };
      if (has_enquiry) {
        idModal = 'boq-republish-enquiry-started';
        navTitle = 'boq-republish-warn-title';
        title = 'boq-republish-warn-body';
        textArea = true;
        handleAccept = (newApproveMessage) => {
          if (newApproveMessage) {
            setOpen({
              id: 'boq-republish-enquiry-ongoing',
              navTitle: 'boq-republish-reason-title',
              title: 'boq-republish-reason-body',
              cancel,
              confirm,
              backdropClick: true,
              handleAccept: () => {
                setReasonMessage(newApproveMessage);
                setOpenRepublish(false);
              },
            });
            setOpenRepublish(false);
          } else {
            setReasonMessage('');
          }
        };
      }
      setOpenRepublish(has_enquiry);
      setOpen({
        id: idModal,
        navTitle,
        title,
        cancel,
        confirm,
        backdropClick,
        textArea,
        handleAccept,
      });
    } else {
      setOpen({
        id: 'edit-bow',
        navTitle: 'boq-publish-warn-title',
        title: 'boq-publish-warn-body',
        cancel: 'cancel',
        confirm: 'confirm',
        backdropClick: true,
        handleAccept: () => {
          setOpen(false);
          dispatch(
            actions.publishBoQ({ id, status: projectStatuses.published.id })
          )
            .then(() => dispatch(actions.fetchBoQList(slug)))
            .then(() => dispatch(actions.setEditingMode({ id, value: false })))
            .then(() => {
              setOpen(false);
            });
        },
      });
    }
  };

  const isEditable = (params) => {
    if (!editing) {
      return false;
    }
    if (params) {
      const { row, field } = params;
      const { type } = row;
      return type === ITEM || acceptedColumns.includes(field);
    }
    return true;
  };

  const setRows = (rows) => dispatch(actions.setSelectedEntries({ id, rows }));

  const handleRetryAiAnalysis = () => {
    stopAiPolling();
    dispatch(clearAiGenerationForPackage({ packageId }));
  };

  const isNewBoqModal = Boolean(open) && open.id === 'new-boq';
  const isEditWarningModal = Boolean(open) && open.id === 'edit-bow';
  const openId = open?.id;
  const isRepublishModal =
    typeof openId === 'string' &&
    (openId === 'boq-publish' || openId.startsWith('boq-republish'));

  const showEditButton = shouldShowBoqEditButton({
    editing,
    isSmartBoqFailedResult,
    hasPublishedVersion: has_published_version,
    entries,
    projectStatuses,
  });

  let confirmModalAcceptSx = {};
  let confirmModalCancelSx = {};
  if (isNewBoqModal || isEditWarningModal) {
    confirmModalAcceptSx = newBoqModalAcceptSx;
    confirmModalCancelSx = newBoqModalCancelSx;
  } else if (isRepublishModal) {
    confirmModalAcceptSx = saveModalAcceptSx;
    confirmModalCancelSx = saveModalCancelSx;
  }

  return (
    <>
      <Modal
        open={open}
        setOpen={setOpen}
        style={modalSx}
        acceptStyleProp={confirmModalAcceptSx}
        cancelStyleProp={confirmModalCancelSx}
        titleStyleProp={isNewBoqModal ? newBoqModalTitleSx : {}}
        navTitleColor={isNewBoqModal ? boqAccent : undefined}
      />
      <Modal
        open={openSave}
        setOpen={setOpenSave}
        style={modalSx}
        cancelStyleProp={saveModalCancelSx}
        acceptStyleProp={saveModalAcceptSx}
      />
      <Wrapper
        headerTitle={
          !isSmartBoqInProgress && !isAiErrorBlockingBoq ? (
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '20px',
              }}
            >
              {i18next.t('package-notes')}
            </Typography>
          ) : null
        }
        contentHeader={
          !(isSmartBoqInProgress || isAiErrorBlockingBoq) ? (
            <Box sx={boqContentHeaderActionsSx}>
              {showEditButton && (
                <Button
                  sx={boqEditButtonSx}
                  onClick={handleEdit}
                  variant="contained"
                  disabled={headerActionsDisabled}
                >
                  {i18next.t('edit')}
                </Button>
              )}
              {(isSmartBoqFailedResult || editing) && !has_enquiry && (
                <Button
                  sx={boqNewButtonSx}
                  onClick={handleNewBoq}
                  variant="outlined"
                  color="secondary"
                  disabled={headerActionsDisabled}
                >
                  {i18next.t('new-boq')}
                </Button>
              )}
              {editing && !isSmartBoqFailedResult && (
                <Button
                  sx={boqSaveButtonSx}
                  color="primary"
                  variant="outlined"
                  disabled={headerActionsDisabled || !hasChanges}
                  onClick={() => {
                    setOpenSave({
                      id: 'boq-save',
                      navTitle: 'boq-redraft-save-title',
                      title: saveLabel,
                      cancel: 'cancel',
                      confirm: 'confirm',
                      backdropClick: true,
                      handleAccept: () => {
                        handleUpdateBoQ();
                        setOpenSave(false);
                      },
                    });
                  }}
                >
                  {i18next.t('save')}
                </Button>
              )}
              {editing && !isSmartBoqFailedResult && (
                <Button
                  color="primary"
                  variant="contained"
                  onClick={handlePublish}
                  sx={{ ...boqPublishButtonSx, textWrap: 'nowrap' }}
                  disabled={
                    headerActionsDisabled || (!readyAfterTemplate && !saved)
                  }
                >
                  {i18next.t(label)}
                </Button>
              )}
            </Box>
          ) : null
        }
      >
        {isAiEmptyResult && (
          <Box data-testid="ai-empty-result-banner" sx={boqAiInlineAlertBannerSx}>
            <Box sx={boqAiInlineAlertIconBoxSx}>
              <InfoOutlinedIcon sx={{ color: clinkRed, fontSize: 20 }} />
            </Box>
            <Box sx={boqAiInlineAlertTextColSx}>
              <Typography sx={boqAiInlineAlertTitleTypographySx}>
                {i18next.t('boq-smart-builder-empty-title')}
              </Typography>
              <Typography sx={boqAiInlineAlertBodyTypographySx}>
                {i18next.t('boq-smart-builder-empty-body')}
              </Typography>
            </Box>
          </Box>
        )}
        {isAiFailure && (
          <Box data-testid="ai-failure-banner" sx={boqAiInlineAlertBannerSx}>
            <Box sx={boqAiInlineAlertIconBoxSx}>
              <InfoOutlinedIcon sx={{ color: clinkRed, fontSize: 20 }} />
            </Box>
            <Box sx={boqAiInlineAlertTextColSx}>
              <Typography sx={boqAiInlineAlertTitleTypographySx}>
                {i18next.t('boq-smart-builder-failure-title')}
              </Typography>
              <Typography sx={boqAiInlineAlertBodyTypographySx}>
                {i18next.t('boq-smart-builder-empty-body')}
              </Typography>
            </Box>
          </Box>
        )}
        {!isSmartBoqInProgress && !isAiErrorBlockingBoq && (
          <Grid item xs={12} p={4} pt={2}>
              <NoteTextarea
                editing={editing && !isSmartBoqInProgress}
                note={nextNote}
                dispatch={(value) => dispatch(actions.setPackageNote(value))}
                style={inputBaseSx(palette, !editing || isSmartBoqInProgress)}
                id={id}
              />
            </Grid>
        )}
        {isAiInProgress && (
          <Grid item xs={12} px={4} pb={4}>
            <Box
              sx={{
                p: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: boqAccent,
                  mb: 1,
                }}
              >
                {i18next.t('boq-smart-builder-analysis-title')}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: black, opacity: 0.7 }}>
                {i18next.t('boq-smart-builder-analysis-desc')}
              </Typography>

              <Typography sx={{ fontSize: '13px', color: black, opacity: 0.7, mt: 2 }}>
                {i18next.t('boq-smart-builder-analysis-takes')}
              </Typography>
              <Box
                component="ul"
                sx={{
                  mt: 1,
                  mb: 2,
                  pl: 2.5,
                  ml: 0.5,
                  color: black,
                  opacity: 0.75,
                  fontSize: '13px',
                  listStyleType: 'disc',
                  listStylePosition: 'outside',
                  '& li': {
                    display: 'list-item',
                    paddingLeft: '0.25rem',
                    marginBottom: '0.25rem',
                  },
                }}
              >
                <li>{i18next.t('boq-smart-builder-analysis-bullet-1')}</li>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CircularProgress size={16} sx={{ color: boqAccent }} />
                <Typography sx={{ fontSize: '13px', color: black, opacity: 0.7 }}>
                  {i18next.t('boq-smart-builder-analysis-loading')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '13px', color: black, opacity: 0.7 }}>
                  {i18next.t('boq-smart-builder-step-of', {
                    current: progressMeta.current,
                    total: progressMeta.total,
                  })}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: black, opacity: 0.7 }}>
                  {progressMeta.pct}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressMeta.pct}
                sx={{
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: clinkLightPurple,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: boqAccent,
                    borderRadius: 8,
                  },
                }}
              />
            </Box>
          </Grid>
        )}

        {isAiErrorBlockingBoq && (
          <Grid item xs={12} px={4} pb={4}>
            <Box data-testid="ai-service-error-panel" sx={boqAiServiceErrorPanelWrapperSx}>
              <Box sx={boqAiServiceErrorCardSx}>
                <Box sx={boqAiServiceErrorIconCircleSx}>
                  <WarningAmberIcon sx={{ color: clinkRed, fontSize: 22 }} />
                </Box>
                <Box sx={boqAiServiceErrorTextColSx}>
                  <Box component="span" sx={boqAiServiceErrorBadgeSx}>
                    {i18next.t('boq-smart-builder-ai-service-badge')}
                  </Box>
                  <Typography sx={boqAiServiceErrorTitleTypographySx}>
                    {i18next.t('boq-smart-builder-service-error-title')}
                  </Typography>
                  <Typography sx={boqAiServiceErrorSubtitleTypographySx}>
                    {i18next.t('boq-smart-builder-service-error-subtitle')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={boqAiServiceErrorSuggestionsWrapSx}>
                <Typography sx={boqAiServiceErrorSuggestionsHeadingSx}>
                  {i18next.t('boq-smart-builder-service-error-suggestions-heading')}
                </Typography>
                <Box component="ul" sx={boqAiServiceErrorSuggestionsListSx}>
                  <li>{i18next.t('boq-smart-builder-service-error-suggestion-1')}</li>
                  <li>{i18next.t('boq-smart-builder-service-error-suggestion-2')}</li>
                </Box>
              </Box>

              <Box sx={boqAiServiceErrorRetryRowSx}>
                <Button
                  variant="contained"
                  onClick={handleRetryAiAnalysis}
                  sx={boqAiServiceErrorRetryButtonSx}
                >
                  {i18next.t('boq-smart-builder-retry-boq')}
                </Button>
              </Box>
            </Box>
          </Grid>
        )}

        {!isAiInProgress && !isAiErrorBlockingBoq && (
          <>
            <Grid item width="100%">
              <Box
                id="datagrid-wrapper"
                sx={{
                  width: '100%',
                  pr: 1,
                }}
              >
                {showBoqGridSkeleton ? (
                  <Box sx={{ pl: 1 }}>
                    <Skeleton
                      variant="rectangular"
                      height={44}
                      sx={{ borderRadius: '8px 8px 0 0' }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={420}
                      sx={{ borderRadius: '0 0 8px 8px', mt: 0.5 }}
                    />
                  </Box>
                ) : (
                  <DataGrid
                  useRows={[nextEntries, setRows]}
                  autoHeight
                  showColumnVerticalBorder={false}
                  getRowHeight={(params) => estimateBoqRowHeight(params.model)}
                  columns={columnsGrid}
                  entries={entries}
                  units={units}
                  rowReordering={editing}
                  isCellEditable={isEditable}
                  sx={getBoqContentDataGridSx({
                    boqSectionBg,
                    borderbox,
                    darkCharcoal,
                    eerieBlack,
                    white,
                  })}
                  getRowClassName={(params) => {
                    let extraClasses = '';
                    if (params) {
                      const { row } = params;
                      const item_version = row?.item_version;
                      const status = item_version?.status;
                      extraClasses =
                        Number(status) === DELETE_STATUS ? ' hide-row' : '';
                    }
                    return `boq--${params.row.type}${extraClasses}`;
                  }}
                  getCellClassName={(params) => {
                    if (params) {
                      const { row, field } = params;
                      const { type } = row;
                      const showCell =
                        field === '__reorder__' ||
                        field === 'description' ||
                        type === ITEM ||
                        (acceptedColumns.includes(field) &&
                          type === GROUPED_HEADING) ||
                        (sectionAcceptedColumns.includes(field) &&
                          type === SECTION);
                      const priceCell =
                        field === 'budget_rate' || field === 'budget_total';
                      if (showCell && priceCell) {
                        return 'show price-cell';
                      }
                      if (showCell) {
                        return 'show';
                      }
                    }
                    return 'hide';
                  }}
                />
                )}
              </Box>
            </Grid>
            <Footer total={totalPrice} editing={editing} />
          </>
        )}
      </Wrapper>
    </>
  );
};

const EnableChecker = (props) => {
  if (!props.enable) {
    return null;
  }

  return <Content {...props} />;
}

const mapStateToProps = (state) => {
  return {
    boq: state.boq,
  };
};

export default connect(mapStateToProps)(EnableChecker);
