import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MuiAlert from '@mui/material/Alert';
import flag from 'v2/helpers/flags';
import Loading from 'v1/global/components/Loading';
import { goToNewTab } from 'v2/helpers/url';
import { useNavigate, useParams } from 'react-router-dom';
import DemoButton from 'v2/apps/shared/components/demo-button';
import ProgressBar from './ProgressBar';
import SendButton from './SendButton';
import ApproverModal from 'v2/apps/shared/components/approver-modal/approverModal';
import RejectModal from './RejectModal';
import i18next from 'v2/helpers/i18n';
import RejectedOrdersPanel from './RejectedOrdersPanel';
import { connect, useDispatch } from 'react-redux';
import { useContext } from 'hooks/context';
import Snackbar from '@mui/material/Snackbar';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { hoverGray, clinkOrange, darkLightGrey } from 'v2/constants/colors';
import Typography from '@mui/material/Typography';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';

const Header = ({
  actionButtons,
  showForm,
  canSend,
  docusignSendEmail,
  formPercentage,
  handleConfigSave,
  handleApprovalRequest,
  handleApproveOrRejectOrder,
  handleRejectionAcknowledge,
  did,
  handleSend,
  errorStatus,
  docType,
  subcontractor,
  loadingConfigService,
  info = 0,
  setMissingHighlight = () => null,
  approversList = [],
  isDocumentUpdated,
  assignedApproversRaw,
  assignedApprovers,
  status,
  initPage,
  meta,
  projectSlug,
  project,
  contextType = 'clink',
}) => {
  const navigate = useNavigate();
  const { checkFeature } = useFeatureFlag();
  const isTenderInquiryApprovalEnabled = checkFeature(
    'TENDER_INQUIRY_APPROVAL',
  );
  const [approverModalOpen, setApproverModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveOrRejectLoading, setApproveOrRejectLoading] = useState(false);
  const [orderApprovedOrRejected, setOrderApprovedOrRejected] = useState(false);
  const [approvalRequestSent, setApprovalRequestSent] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tenderApprovalOrRejectionSent, setTenderApprovalOrRejectionSent] =
    useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const pid = project?.data?.id;
  const { tenderId } = useParams();
  const context = useContext(contextType);
  const dispatch = useDispatch();
  const { actions } = context;

  const [fieldsData] = useState(
    docType === 'tender'
      ? {
          title: i18next.t('reject_tender_title'),
          content: i18next.t('reject_tender_description'),
          placeholder: i18next.t('reject_tender_placeholder'),
          note: i18next.t('reject_tender_note'),
          successMessage: i18next.t('reject_tender_success'),
          errorMessage: i18next.t('reject_tender_error'),
        }
      : {
          title: i18next.t('reject_order_title'),
          content: i18next.t('reject_order_description'),
          placeholder: i18next.t('reject_order_placeholder'),
          note: i18next.t('reject_order_note'),
          successMessage: i18next.t('reject_order_success'),
          errorMessage: i18next.t('reject_order_error'),
        },
  );
  const envelopes = info?.envelopes || null;
  const isSendOrApprovalBtnDisabled = useMemo(() => {
    return (
      (showForm && Number(formPercentage || 0) < 100) ||
      !canSend ||
      Boolean(errorStatus) ||
      (flag('FEATURES') && (!envelopes || !Number(envelopes.current)))
    );
  }, [showForm, formPercentage, canSend, errorStatus, envelopes]);

  const matchedApprover = useMemo(() => {
    if (!assignedApproversRaw?.isLevel) {
      return assignedApprovers?.find(
        (ap) =>
          ap?.status?.label === 'Pending' &&
          String(ap?.approver_user_id) === String(info?.user?.id),
      );
    }

    const activeLevel = Object.values(
      assignedApproversRaw.approvals ?? {},
    ).find((levelObj) => levelObj?.status === 'in_progress');

    return activeLevel?.approvers?.find(
      (ap) =>
        ap?.status?.label === 'Pending' &&
        String(ap?.approver_user_id) === String(info?.user?.id),
    );
  }, [assignedApprovers, assignedApproversRaw, info?.user?.id]);

  const rejectedOrders = useMemo(() => {
    return assignedApprovers
      .filter((ap) => ap.status?.label === 'Rejected')
      .map((item) => {
        const user = item?.user ?? item?.approver_user ?? {};
        const displayName =
          user?.display_name ??
          `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim();
        return {
          id: item?.id,
          approver: {
            name: displayName,
            email: user?.email,
            role: user?.account_role_label,
          },
          status: item?.status?.label,
          rejectedAt: item?.updated_at,
          reason: item?.comment,
        };
      });
  }, [assignedApprovers]);

  const canApproveOrRejectOrder = useMemo(() => {
    return (
      flag('APPROVAL_THRESHOLD') &&
      showForm &&
      docType === 'order' &&
      assignedApprovers.some(
        (ap) => ap.approver_user_id === Number(info.user.id),
      )
    );
  }, [assignedApprovers, docType, info.user.id, showForm]);

  const matchedTenderApprover = useMemo(() => {
    return assignedApprovers.find(
      (ap) =>
        ap?.user_id === Number(info.user.id) &&
        ap?.status?.label?.toLowerCase() === 'pending' &&
        ap?.levelStatus === 'in_progress',
    );
  }, [assignedApprovers, info.user.id]);

  const canApproveOrRejectTenderEnquiry = useMemo(() => {
    return (
      showForm &&
      docType === 'tender' &&
      !tenderApprovalOrRejectionSent &&
      Boolean(matchedTenderApprover)
    );
  }, [docType, matchedTenderApprover, showForm, tenderApprovalOrRejectionSent]);

  const orderApproveRejectBtnDisabled = useMemo(() => {
    const currentUserId = Number(info.user.id);
    const userApprovals = assignedApprovers
      .filter((a) => a.approver_user_id === currentUserId)
      .sort((a, b) => a.level - b.level);
    const hasApprovedPreviousAndPendingNext = userApprovals.some(
      (approval, index) =>
        approval.status?.label === 'Pending' &&
        userApprovals
          .slice(0, index)
          .some((prev) => prev.status?.label === 'Approved'),
    );
    const hasNonPendingWithoutNextEligible = userApprovals.some(
      (a) => a.status?.label !== 'Pending',
    );

    return (
      orderApprovedOrRejected ||
      (hasNonPendingWithoutNextEligible && !hasApprovedPreviousAndPendingNext)
    );
  }, [assignedApprovers, info.user.id, orderApprovedOrRejected]);

  const hasAcknowledgeOrRejectedCase = useMemo(() => {
    return (
      (!isAcknowledged && !assignedApprovers.length) ||
      (isAcknowledged &&
        (!assignedApprovers.length ||
          assignedApprovers[0]?.status?.label?.toLowerCase() === 'rejected'))
    );
  }, [isAcknowledged, assignedApprovers]);

  const showRequestApprovalBtn = useMemo(() => {
    const isOrder = docType === 'order';
    const isTender = docType === 'tender';

    if (isOrder) {
      return (
        flag('APPROVAL_THRESHOLD') &&
        showForm &&
        (status === 'Draft' ||
          status === 'Pending Approval' ||
          status === 'Withdrew' ||
          status === 'Rejected') &&
        !assignedApprovers.some(
          (ap) => ap.approver_user_id === Number(info.user.id),
        ) &&
        approversList.length > 0
      );
    }
    if (isTender) {
      return (
        isTenderInquiryApprovalEnabled &&
        ((hasAcknowledgeOrRejectedCase &&
          showForm &&
          approversList.length > 0) ||
          (isDocumentUpdated &&
            assignedApprovers[0]?.status?.label === 'Approved'))
      );
    }

    return false;
  }, [
    assignedApprovers,
    approversList?.levels?.length,
    docType,
    info.user.id,
    showForm,
    status,
    hasAcknowledgeOrRejectedCase,
    isDocumentUpdated,
    isTenderInquiryApprovalEnabled,
  ]);

  const showRejections = useMemo(() => {
    if (docType === 'tender') {
      return (
        rejectedOrders.length > 0 &&
        assignedApprovers.some(
          (ap) => ap?.requester_user_id === Number(info.user.id),
        )
      );
    }

    return (
      flag('APPROVAL_THRESHOLD') &&
      status === 'Rejected' &&
      rejectedOrders.length > 0 &&
      !assignedApprovers.some(
        (ap) => ap.approver_user_id === Number(info.user.id),
      )
    );
  }, [docType, status, rejectedOrders.length, assignedApprovers, info.user.id]);

  const showSendButton = useMemo(() => {
    if (!showForm) return false;

    const isOrder = docType === 'order';
    const isTender = docType === 'tender';

    // For documents other than order or tender, always show
    if (!isOrder && !isTender) return true;

    // Tender-enquiry approval flag off: keep existing behaviour (always show,
    // enablement is gated separately via isSendOrApprovalBtnDisabled)
    if (isTender && !isTenderInquiryApprovalEnabled) return true;

    // For order or tender documents
    // Don't show if status is 'Pending Approval'
    if (status === 'Pending Approval') return false;

    // Show if there are no approvers in the list
    if (!approversList.length) {
      if (assignedApprovers[0]?.user_id === Number(info?.user?.id)) {
        return false;
      }
      return true;
    }

    if (
      assignedApprovers[0]?.status?.label === 'Approved' &&
      isTender &&
      !isDocumentUpdated
    ) {
      return true;
    }

    return false;
  }, [
    showForm,
    docType,
    status,
    approversList.length,
    assignedApprovers,
    isDocumentUpdated,
    isTenderInquiryApprovalEnabled,
  ]);

  const handlePreviewClick = () =>
    goToNewTab(`/document-creator/template/${did}/preview`);

  const assignTenderInquiryApproval = useCallback(
    (selectedApprover) => {
      if (pid && did) {
        return dispatch(
          actions.assignTenderInquiryApprover({
            project_id: pid,
            did,
            tenderId,
            data: {
              user_ids: [selectedApprover],
            },
          }),
        ).unwrap();
      }
      return undefined;
    },
    [actions, dispatch, pid, did],
  );

  const approverConfirmHandler = (selectedApprover) => {
    if (docType === 'order') {
      handleApprovalRequest(selectedApprover);
    } else {
      assignTenderInquiryApproval(selectedApprover);
    }
  };

  const handleTenderApprovalOrRejection = async (decision, feedback = '') => {
    setApproveOrRejectLoading(true);
    try {
      const response = await dispatch(
        actions.approveRejectInquiry({
          project_id: pid,
          did,
          tenderId,
          approver_id: matchedTenderApprover?.id,
          data: {
            status: decision === 'approve' ? 'Approved' : 'Rejected',
            comment: feedback,
            user_id: Number(info?.user?.id),
          },
        }),
      ).unwrap();

      if (response?.success) {
        setSnackbarOpen(true);
        setSnackbarSeverity('success');
        setSnackbarMessage(
          decision === 'approve'
            ? 'Tender Approved Successfully !'
            : 'Tender Rejected Successfully !',
        );
        setTenderApprovalOrRejectionSent(true);
        if (decision === 'reject') {
          setRejectModalOpen(false);
        }
      }
      return response;
    } catch (err) {
      setSnackbarOpen(true);
      setSnackbarSeverity('error');
      setSnackbarMessage('Something went wrong ! Please try again.');
      return undefined;
    } finally {
      setApproveOrRejectLoading(false);
    }
  };

  const hasRejectedTenderInquiry = useMemo(() => {
    return assignedApprovers.some(
      (ap) => ap?.status?.label?.toLowerCase() === 'rejected',
    );
  }, [assignedApprovers]);

  const onAcknowledgeHandler = async () => {
    try {
      const response = await dispatch(
        actions.acknowledgeRejectionFeedback({
          project_id: pid,
          did,
        }),
      ).unwrap();

      if (response.success) {
        setIsAcknowledged(true);
        setSnackbarMessage(i18next.t('feedback-acknowledged'));
      }
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage(
        err?.message || 'Something went wrong ! Please try again.',
      );
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleApprovalSubmit = useCallback(
    async ({ selectedApprovers, varianceExplanation }) => {
      await handleApprovalRequest(selectedApprovers, varianceExplanation);
      if (initPage) initPage();
      setApprovalRequestSent(true);
    },
    [handleApprovalRequest, initPage],
  );

  const handleApproveOrderConfirm = async () => {
    try {
      setApproveOrRejectLoading(true);
      await handleApproveOrRejectOrder(matchedApprover.id, 'Approved');
      initPage();
      setSnackbarSeverity('success');
      setSnackbarMessage(i18next.t('approve_order_success'));
      setOrderApprovedOrRejected(true);
      if (projectSlug) {
        navigate(`/main-contractor/project/${projectSlug}/orders`);
      }
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage(i18next.t('approve_order_error'));
    } finally {
      setApproveOrRejectLoading(false);
      setSnackbarOpen(true);
    }
  };

  const handleApproveConfirm = () => {
    if (docType === 'order') {
      return handleApproveOrderConfirm();
    }
    return handleTenderApprovalOrRejection('approve');
  };

  const handleAcknowledge = async () => {
    try {
      const response = await handleRejectionAcknowledge(did);
      if (docType === 'tender' && response?.success) {
        setIsAcknowledged(true);
      }
      initPage();
      setSnackbarSeverity('success');
      setSnackbarMessage(i18next.t('rejection-acknowledged-success'));
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage(i18next.t('rejection-acknowledged-error'));
      setSnackbarOpen(true);
    }
  };
  return (
    <>
      <Box>
        {showForm && !loadingConfigService && (
          <Box display="flex" flexDirection="column" gap="12px">
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <ProgressBar
                currentCompletion={formPercentage}
                setMissingHighlight={setMissingHighlight}
              />
            </Box>
            {showRejections && (
              <>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap="10px"
                  p="12px 16px"
                  sx={{
                    backgroundColor: hoverGray,
                    border: `1px solid ${clinkOrange}`,
                    borderRadius: '6px',
                  }}
                >
                  <WarningAmberIcon
                    fontSize="small"
                    sx={{ color: clinkOrange }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: clinkOrange }}>
                      {i18next.t('rejection-action-required-title')}
                    </Typography>
                    <Typography
                      variant="body2"
                      mt="2px"
                      sx={{ color: clinkOrange }}
                    >
                      {i18next.t('rejection_action_required_description', {
                        type: docType === 'tender' ? 'tender' : 'order',
                      })}
                    </Typography>
                  </Box>
                </Box>

                <RejectedOrdersPanel
                  rejectedOrders={rejectedOrders}
                  onAcknowledge={handleAcknowledge}
                  docType={docType}
                />
              </>
            )}
          </Box>
        )}
      </Box>
      <Box>
        <Grid container justifyContent="flex-end" sx={{ m: '15px 0' }}>
          {actionButtons && (
            <>
              <Grid display="flex" justifyContent="center" item xs={12}>
                {loadingConfigService && <Loading />}
              </Grid>
              <Grid item xs={12} textAlign="right" marginRight="50px">
                <DemoButton type="asite" />
              </Grid>
              {docType === 'order' && (
                <Grid item>
                  <DemoButton type="operational" />
                </Grid>
              )}
              <Grid item>
                <Button
                  sx={{ ml: '15px' }}
                  color="border"
                  variant="outlined"
                  onClick={handlePreviewClick}
                  disabled={Boolean(errorStatus)}
                  data-testid="document-creator-preview-btn"
                >
                  {i18next.t('preview')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  sx={{ m: '0 15px' }}
                  disabled={Boolean(errorStatus)}
                  onClick={handleConfigSave}
                  color="border"
                  variant="contained"
                  data-testid="document-creator-save-btn"
                >
                  {i18next.t('save')}
                </Button>
              </Grid>
              {showForm &&
                ((status !== 'Pending Approval' &&
                  docType === 'order' &&
                  !approversList.length) ||
                  (docType !== 'order' &&
                    showSendButton &&
                    (!isTenderInquiryApprovalEnabled ||
                      status === 'Approved'))) && (
                  <Grid item>
                    <SendButton
                      info={info}
                      disabled={isSendOrApprovalBtnDisabled}
                      handleSend={handleSend}
                      docType={docType}
                      did={did}
                      subcontractor={subcontractor}
                      docusignSendEmail={docusignSendEmail}
                      meta={meta}
                    >
                      {i18next.t('send')}
                    </SendButton>
                  </Grid>
                )}
              {showRequestApprovalBtn && (
                <Grid item>
                  <Button
                    sx={{ ml: '15px' }}
                    disabled={
                      isSendOrApprovalBtnDisabled ||
                      status === 'Rejected' ||
                      (status !== 'Rejected' &&
                        !isDocumentUpdated &&
                        formPercentage < 100) ||
                      approvalRequestSent
                    }
                    onClick={() => setApproverModalOpen(true)}
                    color="primary"
                    variant="contained"
                    data-testid="document-creator-request-approval-btn"
                  >
                    {i18next.t('request-approval')}
                  </Button>
                </Grid>
              )}
              {(canApproveOrRejectOrder || canApproveOrRejectTenderEnquiry) && (
                <Grid item>
                  <Button
                    sx={{ m: '0 15px' }}
                    disabled={
                      docType === 'order'
                        ? orderApproveRejectBtnDisabled
                        : approveOrRejectLoading
                    }
                    onClick={() => setRejectModalOpen(true)}
                    color="primary"
                    variant="contained"
                    data-testid="document-creator-reject-order-btn"
                  >
                    {docType === 'order'
                      ? i18next.t('reject-order')
                      : i18next.t('reject')}
                  </Button>
                </Grid>
              )}
              {(canApproveOrRejectOrder || canApproveOrRejectTenderEnquiry) && (
                <Grid item>
                  <Button
                    sx={{ my: 0 }}
                    disabled={
                      (docType === 'order' && orderApproveRejectBtnDisabled) ||
                      approveOrRejectLoading
                    }
                    onClick={handleApproveConfirm}
                    color="primary"
                    variant="contained"
                    data-testid="document-creator-approve-order-btn"
                  >
                    {approveOrRejectLoading ? (
                      <Box display="flex" alignItems="center" gap="8px">
                        <CircularProgress
                          size={16}
                          sx={{ color: darkLightGrey }}
                        />
                        {i18next.t('approving')}
                      </Box>
                    ) : (
                      i18next.t(
                        docType === 'order' ? 'approve-order' : 'approve',
                      )
                    )}
                  </Button>
                </Grid>
              )}
              <ApproverModal
                id={did}
                open={approverModalOpen}
                onClose={() => setApproverModalOpen(false)}
                onSubmit={handleApprovalSubmit}
                approvalType={docType === 'order' ? 'order' : 'tender_enquiry'}
                meta={meta}
              />
              <RejectModal
                fields={fieldsData}
                approverInfo={
                  docType === 'tender' ? matchedTenderApprover : matchedApprover
                }
                open={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                onReject={
                  docType === 'tender'
                    ? (comment) =>
                        handleTenderApprovalOrRejection('reject', comment)
                    : handleApproveOrRejectOrder
                }
                reloadData={initPage}
                setOrderApprovedOrRejected={setOrderApprovedOrRejected}
                projectSlug={projectSlug}
                docType={docType}
                isSubmitting={approveOrRejectLoading}
              />
            </>
          )}
        </Grid>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    projectSlug: state?.project?.data?.slug,
    project: state.project,
  };
};

export default connect(mapStateToProps)(Header);
