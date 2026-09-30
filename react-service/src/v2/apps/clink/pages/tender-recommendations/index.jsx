import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import { connect } from 'react-redux';
import Filters from './Filters';
import DataTable from './DataTable';
import { useContext } from 'hooks/context';
import { useParams, useNavigate } from 'react-router-dom';
import Empty from './Empty';
import PdfDialog from 'v2/apps/clink/pages/tender-recommendations/PdfDialog';
import { getQueryStringVars } from 'v2/helpers/url';
import i18next from 'v2/helpers/i18n';
import { httpHelperV2 } from 'v2/services/httpHelper';
import LogsModal from 'v2/apps/shared/components/logs-modal';
import ApproverModal from 'v2/apps/shared/components/approver-modal/approverModal';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import RejectModal from 'v1/document-creator/components/page/header/RejectModal';
import CancelTrConfirmationDialog from 'v2/apps/clink/pages/tender-recommendations/CancelTrConfirmationDialog';
import IssueOrderForm from 'v2/apps/clink/pages/tender-analysis/summary/actions/Form';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import { white } from 'v2/constants/colors';

const TableSkeleton = ({ rows = [] }) => (
  <Box sx={{ width: '100%' }}>
    <Skeleton
      variant="rectangular"
      height={52}
      sx={{ mb: 1, borderRadius: 1 }}
    />
    {rows?.map((id) => (
      <Skeleton
        key={id}
        variant="rectangular"
        height={52}
        sx={{ mb: 0.5, borderRadius: 1 }}
      />
    ))}
  </Box>
);

const TenderRecommendations = ({
  contextType = 'clink',
  dispatch,
  project,
  clinkAccount,
  tenderRecommendations,
  recommendationsLoading,
  tenderRecommendationLogsData,
}) => {
  const context = useContext(contextType);
  const { actions } = context;
  const pid = project?.data?.id;
  const params = useParams();
  const { slug } = params;
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const { tender_recommendation_id: trId, scroll } = getQueryStringVars();
  const [approverModalOpen, setApproverModalOpen] = useState(false);
  const [cancelTrConfirmModalOpen, setCancelTrConfirmModalOpen] =
    useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedTrId, setSelectedTrId] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isApprover, setIsApprover] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [issueOrderModalOpen, setIssueOrderModalOpen] = useState(false);
  const [orderTemplates, setOrderTemplates] = useState([]);
  const [quotesData, setQuotesData] = useState({});
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  }, []);
  const scrollInfo = { trId, scroll };
  const [fieldsData] = useState({
    title: i18next.t('reject_tr_title'),
    content: i18next.t('reject_tr_description'),
    placeholder: i18next.t('reject_tr_placeholder'),
    note: i18next.t('reject_tr_note'),
    successMessage: i18next.t('reject_tr_success'),
    errorMessage: i18next.t('reject_tr_error'),
  });
  const fetchTenderRecommendationsList = useCallback(() => {
    if (pid) {
      dispatch(actions.getTenderRecommendations({ project_id: pid }));
    }
  }, [actions, dispatch, pid]);

  useEffect(() => {
    dispatch(actions.fetchOrderTemplates())
      .unwrap()
      .then((templates) => {
        const sortedTemplates = [...templates].sort((a, b) =>
          (a?.name ?? '')
            .toLowerCase()
            .localeCompare((b?.name ?? '').toLowerCase()),
        );
        setOrderTemplates(sortedTemplates);
      })
      .catch((error) => {
        const errorMessage = error?.message;
        showSnackbar(
          errorMessage || i18next.t('fetch-order-templates-error'),
          'error',
        );
      });
  }, [dispatch, actions, showSnackbar]);

  const sendTrReminderForPanel = useCallback(
    ({ approver_id, tid }) => {
      if (pid && tid && approver_id) {
        return dispatch(
          actions.sendTrApprovalReminder({
            project_id: pid,
            tid,
            approval_id: approver_id,
          }),
        ).unwrap();
      }
      return Promise.reject(new Error('Missing required parameters'));
    },
    [actions, dispatch, pid],
  );

  const cancelTr = useCallback(() => {
    if (pid && selectedTrId) {
      setCancelling(true);
      dispatch(
        actions.updateTenderRecommendationById({
          project_id: pid,
          tid: Number(selectedTrId),
          data: {
            status: 'Cancelled',
          },
        }),
      )
        .unwrap()
        .then(() => {
          showSnackbar(i18next.t('tr-cancel-success-msg'), 'success');
          fetchTenderRecommendationsList();
        })
        .catch((error) => {
          setCancelling(false);
          const errorMessage = error?.message;
          showSnackbar(errorMessage, 'error');
        })
        .finally(() => {
          setCancelTrConfirmModalOpen(false);
        });
    }
  }, [
    actions,
    dispatch,
    fetchTenderRecommendationsList,
    pid,
    selectedTrId,
    showSnackbar,
  ]);

  const cancelTrClick = useCallback((tr_id) => {
    setCancelling(false);
    setSelectedTrId(tr_id);
    setCancelTrConfirmModalOpen(true);
  }, []);

  const handleRequestApproval = useCallback(
    ({ selectedApprovers }) => {
      if (pid && selectedTrId) {
        return dispatch(
          actions.assignTenderRecommendationApprover({
            project_id: pid,
            tid: selectedTrId,
            data: selectedApprovers,
          }),
        ).unwrap();
      }
      return undefined;
    },
    [actions, dispatch, pid, selectedTrId],
  );

  const onApproveRequestClick = useCallback((tr_id) => {
    setSelectedTrId(tr_id);
    setApproverModalOpen(true);
  }, []);

  const getCurrentRecommendationWithApprover = useCallback(() => {
    const recommendationId = trId || selectedTrId;

    const recommendation = tenderRecommendations?.find(
      (tr) => String(tr.tender_recommendation_id) === String(recommendationId),
    );

    if (!recommendation?.assigned_approvers?.length) {
      return {
        recommendation,
        approverId: null,
        isApprover: false,
      };
    }

    let currentApprover = null;

    if (recommendation?.isLevel) {
      const activeLevel = recommendation.assigned_approvers.find(
        (levelObj) => levelObj?.status === 'in_progress',
      );

      currentApprover = activeLevel?.approvers?.find(
        (approver) =>
          approver?.status?.label === 'Pending' &&
          String(approver?.approver_user?.id) ===
            String(clinkAccount?.user?.id),
      );
    } else {
      // Old non-level structure
      currentApprover = recommendation.assigned_approvers.find(
        (approver) =>
          approver?.status?.label === 'Pending' &&
          String(approver?.approver_user?.id) ===
            String(clinkAccount?.user?.id),
      );
    }

    return {
      recommendation,
      approverId: currentApprover?.id,
      isApprover: !!currentApprover,
    };
  }, [tenderRecommendations, trId, selectedTrId, clinkAccount?.user?.id]);

  const handleApproveOrRejectOrder = useCallback(
    async (status, comment = '') => {
      const { approverId } = getCurrentRecommendationWithApprover();

      if (!approverId) {
        showSnackbar(
          i18next.t('not-authorized-to-action-recommendation', {
            action: status.toLowerCase(),
          }),
          'error',
        );
        return;
      }

      try {
        await dispatch(
          actions.approveOrRejectTenderRecommendation({
            project_id: pid,
            tender_recommendation_id: trId || selectedTrId,
            approver_id: approverId,
            data: {
              status,
              comment,
            },
          }),
        ).unwrap();

        showSnackbar(
          i18next.t('tender-recommendation-action-success', {
            action: status.toLowerCase(),
          }),
          'success',
        );
        setRejectModalOpen(false);
        setOpenPdf(false);
        fetchTenderRecommendationsList();
      } catch (error) {
        showSnackbar(
          error?.message ||
            i18next.t('tender-recommendation-action-failed', {
              action: status.toLowerCase(),
            }),
          'error',
        );
      }
    },
    [
      actions,
      dispatch,
      pid,
      trId,
      selectedTrId,
      getCurrentRecommendationWithApprover,
      fetchTenderRecommendationsList,
      showSnackbar,
    ],
  );

  const handleApprove = useCallback(() => {
    return handleApproveOrRejectOrder('Approved', '');
  }, [handleApproveOrRejectOrder]);

  const handleRejectClick = useCallback(() => {
    const { isApprover: canApprove } = getCurrentRecommendationWithApprover();
    if (!canApprove) {
      showSnackbar(
        i18next.t('not-authorized-to-reject-recommendation'),
        'error',
      );
      return;
    }
    setOpenPdf(false);
    setRejectModalOpen(true);
  }, [getCurrentRecommendationWithApprover, showSnackbar]);

  const handleRejectSubmit = useCallback(
    async (comment) => {
      setRejectLoading(true);
      try {
        await handleApproveOrRejectOrder('Rejected', comment || '');
      } finally {
        setRejectLoading(false);
      }
    },
    [handleApproveOrRejectOrder],
  );

  const withDrawTr = useCallback(
    (tr_id) => {
      if (pid && tr_id) {
        dispatch(
          actions.withDrawTenderRecommendation({
            project_id: pid,
            tid: tr_id,
          }),
        )
          .then(() => {
            fetchTenderRecommendationsList();
            showSnackbar(i18next.t('tr-withdraw-success-msg'), 'success');
          })
          .catch((error) => {
            const errorMessage =
              error?.response?.data?.message || error?.message;
            showSnackbar(errorMessage, 'error');
          });
      }
    },
    [actions, dispatch, fetchTenderRecommendationsList, pid, showSnackbar],
  );

  useEffect(() => {
    fetchTenderRecommendationsList();
  }, [fetchTenderRecommendationsList]);

  const viewReport = useCallback(
    (tr_id) => {
      if (pid && tr_id) {
        httpHelperV2({
          url: `project/${pid}/tender_recommendation/${tr_id}/report/generate`,
          method: 'POST',
        })
          .then((result) => {
            if (result?.url) {
              setSelectedTrId(tr_id);
              setIsApprover(
                result?.is_approver &&
                  result?.tender_recommendation?.status === 'Pending',
              );
              setPdfUrl(`${result.url}#toolbar=0&navpanes=0&scrollbar=0`);
              setOpenPdf(true);
            }
            if (
              result?.tender_recommendation?.status === 'Draft' ||
              result?.tender_recommendation?.status === 'Cancelled'
            ) {
              showSnackbar(
                i18next.t(
                  'request-withdrawn-or-cancelled-no-longer-pending-msg',
                ),
                'error',
              );
            }
          })
          .catch((error) => {
            const errorMessage = error?.message;
            showSnackbar(errorMessage, 'error');
          })
          .finally(() => {});
      }
    },
    [pid, showSnackbar],
  );

  const viewLogs = useCallback(
    (trid) => {
      if (pid && trid) {
        dispatch(
          actions.getAuditLogsTenderRecommendationById({
            project_id: pid,
            tender_recommendation_id: trid,
          }),
        )
          .then(() => setLogsModalOpen(true))
          .catch((error) => {
            const errorMessage = error?.response?.data?.message;
            showSnackbar(errorMessage, 'error');
          });
      }
    },
    [actions, dispatch, pid, showSnackbar],
  );

  useEffect(() => {
    viewReport(trId);
  }, [trId, viewReport]);

  const handleIssueOrder = useCallback((tenderData) => {
    const quoteInfo = {
      id: tenderData?.transaction_id,
      subcontractor: {
        id: tenderData?.subcontractor?.id,
      },
      tender_id: tenderData?.package_id,
    };
    setQuotesData(quoteInfo);
    setIssueOrderModalOpen({
      id: 'issue-an-order',
      navTitle: 'issue-an-order',
      title: 'choose-an-order',
      backdropClick: true,
    });
  }, []);

  const handleEdit = useCallback(
    (rowData) => {
      navigate(
        `/main-contractor/project/${slug}/tender_recommendation/${rowData?.package_id}/${rowData?.tender_recommendation_id}`,
      );
    },
    [slug, navigate],
  );

  const handleAction = useCallback(
    (actionKey, row) => {
      const recommendationId = row?.tender_recommendation_id;
      switch (actionKey) {
        case 'edit':
          handleEdit(row);
          break;
        case 'request-approval':
          onApproveRequestClick(recommendationId);
          break;
        case 'view-logs':
          viewLogs(recommendationId);
          break;
        case 'view-report':
          viewReport(recommendationId);
          break;
        case 'withdraw':
          withDrawTr(recommendationId);
          break;
        case 'issue-order':
          handleIssueOrder(row);
          break;
        case 'cancel-tr':
          cancelTrClick(recommendationId);
          break;
        case 'send-reminder':
          sendTrReminderForPanel({
            tid: row.tender_recommendation_id,
            approver_id: row.approval_id,
          }).catch((error) => {
            const errorMessage = error?.message || 'Failed to send reminder';
            showSnackbar(errorMessage, 'error');
          });
          break;
        default:
          break;
      }
    },
    [
      handleEdit,
      onApproveRequestClick,
      viewLogs,
      viewReport,
      withDrawTr,
      handleIssueOrder,
      cancelTrClick,
      sendTrReminderForPanel,
      showSnackbar,
    ],
  );

  const handleCloseLogModal = useCallback(() => {
    setLogsModalOpen(false);
  }, []);

  const handleApprovalSubmit = useCallback(
    async (approvalParams) => {
      await handleRequestApproval(approvalParams);
      fetchTenderRecommendationsList();
    },
    [handleRequestApproval, fetchTenderRecommendationsList],
  );

  const rows = useMemo(() => {
    const list = tenderRecommendations ?? [];
    switch (filter) {
      case 'drafts':
        return list.filter((r) => r.status === 'Draft');
      case 'pending':
        return list.filter((r) => r.status === 'Pending');
      case 'approved':
        return list.filter((r) => r.status === 'Approved');
      case 'rejected':
        return list.filter((r) => r.status === 'Rejected');
      default:
        return list;
    }
  }, [filter, tenderRecommendations]);

  return (
    <>
      <Box sx={{ p: 2, backgroundColor: white, borderRadius: 1 }}>
        <Filters value={filter} onChange={setFilter} />
        <Box sx={{ paddingTop: 1 }}>
          {(() => {
            if (recommendationsLoading) return <TableSkeleton rows={rows} />;
            if (rows?.length > 0) {
              return (
                <DataTable
                  rows={rows}
                  clinkAccount={clinkAccount}
                  onAction={handleAction}
                  scrollInfo={scrollInfo}
                  sendApprovalReminder={sendTrReminderForPanel}
                />
              );
            }
            return (
              <Empty
                slug={slug}
                isFiltered={
                  filter !== 'all' && tenderRecommendations.length > 0
                }
              />
            );
          })()}
        </Box>
      </Box>

      <RejectModal
        fields={fieldsData}
        type="tender-recommendation"
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onReject={handleRejectSubmit}
        projectSlug="tender_recommendations"
        isSubmitting={rejectLoading}
      />

      <PdfDialog
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        pdfUrl={pdfUrl}
        title={i18next.t('tender-recommendations-report')}
        projectId={pid}
        recommendationId={trId || selectedTrId}
        isApprover={isApprover}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      <LogsModal
        open={logsModalOpen}
        onClose={handleCloseLogModal}
        allLogs={tenderRecommendationLogsData?.logs || []}
        headerTitle={i18next.t('tender-recommendations-logs')}
        entity="TR"
        entity_no={tenderRecommendationLogsData?.entity_no}
        package_name={tenderRecommendationLogsData?.package_name}
      />
      <ApproverModal
        id={
          tenderRecommendations?.find(
            (tr) =>
              String(tr.tender_recommendation_id) === String(selectedTrId),
          )?.transaction_id
        }
        open={approverModalOpen}
        onClose={() => setApproverModalOpen(false)}
        onSubmit={handleApprovalSubmit}
        approvalType="tender_recommendation"
      />
      <CancelTrConfirmationDialog
        open={cancelTrConfirmModalOpen}
        onCancel={() => setCancelTrConfirmModalOpen(false)}
        onConfirm={cancelTr}
        loading={cancelling}
      />
      <Modal
        open={issueOrderModalOpen}
        setOpen={setIssueOrderModalOpen}
        style={{ width: '600px' }}
      >
        <IssueOrderForm
          quoteInfo={quotesData}
          orderTemplates={orderTemplates}
          setOpen={setIssueOrderModalOpen}
        />
      </Modal>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(snackbarMessage)}
        autoHideDuration={10000}
        onClose={() => setSnackbarMessage('')}
      >
        <MuiAlert
          onClose={() => setSnackbarMessage('')}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            whiteSpace: 'pre-line',
            '& .MuiAlert-icon': {
              alignSelf: 'center',
            },
            '& .MuiAlert-action': {
              alignSelf: 'center',
            },
          }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

TenderRecommendations.propTypes = {
  contextType: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
  project: PropTypes.shape({
    data: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
  clinkAccount: PropTypes.shape({}),
  tenderRecommendations: PropTypes.arrayOf(PropTypes.shape({})),
  recommendationsLoading: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  project: state.project,
  clinkAccount: state.clinkAccount,
  tenderRecommendations: state.tenderRecommendation.recommendations,
  recommendationsLoading: state.tenderRecommendation.recommendationsLoading,
  tenderRecommendationLogsData:
    state.tenderRecommendation.tenderRecommendationLogs,
});

export default connect(mapStateToProps)(TenderRecommendations);
