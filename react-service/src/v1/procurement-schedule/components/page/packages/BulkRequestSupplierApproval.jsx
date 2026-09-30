import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { connect } from 'react-redux';
import i18next from 'i18next';
import ApproverModal from 'v2/apps/shared/components/approver-modal/approverModal';
import { APPROVAL_TYPES } from 'v2/constants/approval-types';
import { isSelectableForApproval } from 'v2/helpers/status/approval';
import { christmasSilver, gray2, japaneseIndigo } from 'v2/constants/colors';
import { useContext } from 'hooks/context';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import ProjectService from '../../../services/project';

const projectService = new ProjectService();

/**
 * Project-level entry point for requesting supplier approval.
 *
 * Submits every draft supplier across every work package on the project in a
 * single request, so the approver receives one email instead of one per
 * supplier. This replaced the per-work-package "Request Approval" button.
 */
const BulkRequestSupplierApproval = ({
  projectId,
  shortlistedSubcontractors,
  dispatch,
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const { showSnackbar } = useSnackbar();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approverModalOpen, setApproverModalOpen] = useState(false);

  const { supplierCount, packageCount } = useMemo(() => {
    const packagesWithDrafts = Object.values(
      shortlistedSubcontractors ?? {},
    ).map(
      (subcontractors) =>
        (subcontractors ?? []).filter((subcontractor) =>
          isSelectableForApproval(subcontractor?.status),
        ).length,
    );

    return {
      supplierCount: packagesWithDrafts.reduce((total, n) => total + n, 0),
      packageCount: packagesWithDrafts.filter((n) => n > 0).length,
    };
  }, [shortlistedSubcontractors]);

  const triggerBulkUpdateHistoryForApprovedSids = useCallback(
    (sidsByTender) => {
      if (!sidsByTender || typeof sidsByTender !== 'object') return false;

      const tenderIds = Object.keys(sidsByTender).filter(
        (tenderId) => sidsByTender[tenderId]?.length,
      );

      if (!tenderIds.length) return false;

      const body = {};
      tenderIds.forEach((tenderId) => {
        const sids = sidsByTender[tenderId];
        const subcontractorList = shortlistedSubcontractors?.[tenderId] ?? [];
        body[tenderId] = subcontractorList
          .filter((sub) => sids.includes(sub?.subcontractor_id))
          .map((sub) => Number(sub?.subcontractor_id));
      });

      projectService.method = 'POST';
      projectService.projectAction(
        {
          pid: projectId,
          status: 'added',
          type: 'Enquiry',
          method: 'bulkUpdateProjectHistory',
        },
        false,
        () => null,
        body,
      );

      return true;
    },
    [shortlistedSubcontractors, projectId],
  );

  const handleSubmit = useCallback(
    async ({ selectedApprovers }) => {
      if (!projectId) return;

      try {
        const response = await dispatch(
          actions.requestBulkShortlistApproval({
            projectId,
            selectedApprovers,
          }),
        ).unwrap();

        triggerBulkUpdateHistoryForApprovedSids(response?.sids);

        showSnackbar(
          i18next.t('bulk-approval-request-success', {
            count: response?.suppliers ?? supplierCount,
          }),
          'success',
        );
        setApproverModalOpen(false);
        await dispatch(actions.fetchShortlistedSubcontractors(projectId));
      } catch (error) {
        showSnackbar(
          error?.message || i18next.t('bulk-approval-request-error'),
          'error',
        );
        throw error;
      }
    },
    [
      actions,
      dispatch,
      projectId,
      showSnackbar,
      supplierCount,
      triggerBulkUpdateHistoryForApprovedSids,
    ],
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        data-testid="bulk-request-supplier-approval-btn"
        variant="contained"
        fullWidth
        disabled={supplierCount === 0}
        onClick={() => setConfirmOpen(true)}
        sx={{ fontSize: 14, fontWeight: 600, borderRadius: '6px',padding:'10px' }}
      >
        {i18next.t('bulk-request-supplier-approval')}
      </Button>

      <Dialog
        data-testid="bulk-request-confirm-dialog"
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '8px' } }}
      >
        <DialogTitle
          sx={{ fontSize: 18, fontWeight: 700, color: japaneseIndigo, pb: 1 }}
        >
          {i18next.t('bulk-request-approval')}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography sx={{ fontSize: 14, color: japaneseIndigo }}>
            {i18next.t('bulk-request-approval-question')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: gray2, mt: 1 }}>
            {i18next.t('bulk-request-approval-detail', {
              suppliers: supplierCount,
              packages: packageCount,
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            data-testid="bulk-request-confirm-cancel"
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            sx={{
              fontSize: 14,
              borderRadius: '6px',
              borderColor: christmasSilver,
              color: japaneseIndigo,
            }}
          >
            {i18next.t('no-go-back')}
          </Button>
          <Button
            data-testid="bulk-request-confirm-accept"
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              setApproverModalOpen(true);
            }}
            sx={{ fontSize: 14, borderRadius: '6px', px: 3 }}
          >
            {i18next.t('yes')}
          </Button>
        </DialogActions>
      </Dialog>

      <ApproverModal
        id={projectId}
        open={approverModalOpen}
        onClose={() => setApproverModalOpen(false)}
        onSubmit={handleSubmit}
        approvalType={APPROVAL_TYPES.SUPPLIER_LIST}
      />
    </Box>
  );
};

BulkRequestSupplierApproval.propTypes = {
  projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  shortlistedSubcontractors: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};

BulkRequestSupplierApproval.defaultProps = {
  shortlistedSubcontractors: {},
};

const mapStateToProps = (state) => ({
  shortlistedSubcontractors: state.project.shortlistedSubcontractors,
});

export default connect(mapStateToProps)(BulkRequestSupplierApproval);
