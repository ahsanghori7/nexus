import React, { useCallback, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';
import {
  ArrowBackOutlined,
  VisibilityOutlined,
  DescriptionOutlined,
  SaveOutlined,
  ShareOutlined,
} from '@mui/icons-material';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import ApproverModal from 'v2/apps/shared/components/approver-modal/approverModal';

const { black } = CONSTANTS.colors.general;
const TenderRecommendationHeader = ({
  loading,
  setOpenLogModal,
  setOpenPdf,
  saveDraft,
  isSaving,
  handleRequestApproval,
  tenderData,
  clinkAccount,
  approvalRequestSent,
  setApprovalRequestSent,
}) => {
  const [approverModalOpen, setApproverModalOpen] = useState(false);
  const navigate = useNavigate();

  const isApproveRequestBtnOrDraftDisabled = useMemo(() => {
    return Boolean(
      tenderData && (approvalRequestSent || tenderData?.status !== 'Draft'),
    );
  }, [approvalRequestSent, tenderData]);

  const showApproveRequestOrDraftBtn = useMemo(() => {
    return Boolean(
      tenderData &&
      clinkAccount &&
      tenderData?.status === 'Draft' &&
      tenderData?.submitted_by?.id === clinkAccount?.user?.id,
    );
  }, [clinkAccount, tenderData]);

  const requestApproverHandler = useCallback(() => {
    setApproverModalOpen(true);
  }, []);

  return (
    <>
      <Grid2 sx={{ mb: 3, px: 3, pt: 3 }}>
        <Grid2
          container
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          {/* Left side - Title */}
          <Grid2>
            <Grid2 container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid2>
                <Button
                  variant="text"
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    color: black,
                  }}
                  onClick={() => navigate(-1)}
                >
                  <ArrowBackOutlined sx={{ fontSize: 28 }} />
                </Button>
              </Grid2>
              <Grid2>
                <Typography variant="h4" fontWeight={700}>
                  {i18next.t('tender-recommendation')}
                </Typography>
              </Grid2>
            </Grid2>
          </Grid2>

          {/* Right side - Actions */}
          <Grid2>
            <Grid2 container spacing={1} sx={{ alignItems: 'center' }}>
              <Grid2>
                <Button
                  variant="outlined"
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <VisibilityOutlined sx={{ fontSize: 18 }} />
                    )
                  }
                  disabled={loading}
                  onClick={() => {
                    setOpenPdf(true);
                  }}
                >
                  {loading ? i18next.t('loading') : i18next.t('preview')}
                </Button>
              </Grid2>
              <Grid2>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionOutlined sx={{ fontSize: 18 }} />}
                  onClick={() => setOpenLogModal(true)}
                >
                  {i18next.t('view-logs')}
                </Button>
              </Grid2>
              {showApproveRequestOrDraftBtn && (
                <Grid2>
                  <Button
                    variant="outlined"
                    startIcon={
                      isSaving ? (
                        <CircularProgress size={22} />
                      ) : (
                        <SaveOutlined sx={{ fontSize: 18 }} />
                      )
                    }
                    onClick={() => saveDraft()}
                    disabled={isApproveRequestBtnOrDraftDisabled}
                  >
                    {i18next.t('Save-Draft')}
                  </Button>
                </Grid2>
              )}
              {showApproveRequestOrDraftBtn && (
                <Grid2>
                  <Button
                    data-testid="request-for-approval-btn"
                    variant="contained"
                    startIcon={<ShareOutlined sx={{ fontSize: 18 }} />}
                    onClick={requestApproverHandler}
                    disabled={isApproveRequestBtnOrDraftDisabled}
                  >
                    {i18next.t('request-for-approval')}
                  </Button>
                </Grid2>
              )}
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>

      <ApproverModal
        id={tenderData?.transaction_id}
        open={approverModalOpen}
        onClose={() => setApproverModalOpen(false)}
        onSubmit={async (params) => {
          await handleRequestApproval(params);
          setApprovalRequestSent(true);
        }}
        approvalType="tender_recommendation"
      />
    </>
  );
};
const mapStateToProps = (state) => ({
  project: state.project,
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(TenderRecommendationHeader);
