import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Grid2 from '@mui/material/Grid2';
import Switch from '@mui/material/Switch';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { grayDark, christmasSilver, clinkOrange } from 'v2/constants/colors';
import i18next from 'i18next';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const PermissionRow = ({ children }) => (
  <Grid2
    item
    xs={6}
    sx={{
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </Grid2>
);

const getApprovalOptions = (threshold = []) => {
  return threshold?.map((item) => {
    const { id, from_value, to_value } = item;

    const label =
      to_value == null ? `Over ${from_value}` : `${from_value} to ${to_value}`;

    return (
      <MenuItem key={id} value={label}>
        {label}
      </MenuItem>
    );
  });
};

const EditPermissionModal = ({
  open,
  onClose,
  onConfirm,
  member,
  threshold = [],
  openNewThresholdModal,
}) => {
  const { t } = useTranslation();
  const { checkFeature } = useFeatureFlag();
  const hasTenderRecommendation = checkFeature('TENDER_RECOMMENDATION');
  const hasTenderApproval = checkFeature('TENDER_INQUIRY_APPROVAL');
  const hasSubcontractorApproval = checkFeature('SUBCONTRACTOR_LIST_APPROVAL');
  const [approvalLevel, setApprovalLevel] = useState('');
  const [permissions, setPermissions] = useState({
    enabled: false,
    tenderRecommendations: false,
    tenderApprovals: false,
    subcontractorApprovals: false,
    orderApprovals: false,
  });

  const approvalOptions = useMemo(
    () => getApprovalOptions(threshold),
    [threshold],
  );
  const hasApprovalOptions = approvalOptions.length > 0;

  const getDefaultThresholdLabel = useCallback(() => {
    if (threshold && threshold.length > 0) {
      const firstThreshold = threshold[0];
      if (firstThreshold.to_value == null) {
        return `Over ${firstThreshold.from_value}`;
      }
      return `${firstThreshold.from_value} to ${firstThreshold.to_value}`;
    }
    return '';
  }, [threshold]);

  useEffect(() => {
    if (!member || !open) return;

    const memberPermissions = member?.permissions || {};

    setPermissions({
      enabled: memberPermissions.allApprovalPermissions ?? false,
      tenderRecommendations: memberPermissions.tender_recommendation ?? false,
      tenderApprovals: memberPermissions.tender_inquiry_approval ?? false,
      subcontractorApprovals:
        memberPermissions.subcontractor_list_approval ?? false,
      orderApprovals:
        memberPermissions.approval_threshold?.hasPermission ?? false,
    });
  }, [member, open]);

  useEffect(() => {
    if (!member || !open) return;

    const memberPermissions = member?.permissions || {};
    const approval_threshold = memberPermissions.approval_threshold;
    const defaultLabel = getDefaultThresholdLabel();
    if (!defaultLabel) return;

    const thresholdData = approval_threshold?.threshold;
    const thresholdType = thresholdData?.type;

    if (thresholdType === 'threshold_range' && thresholdData) {
      const match = threshold?.find((item) => {
        const isOverValue =
          item.to_value == null &&
          thresholdData.to_value == null &&
          Number(item.from_value) === Number(thresholdData.from_value);

        const isSameRange =
          Number(item.from_value) === Number(thresholdData.from_value) &&
          Number(item.to_value) === Number(thresholdData.to_value);

        return isOverValue || isSameRange;
      });

      if (match) {
        const label =
          match.to_value == null
            ? `Over ${match.from_value}`
            : `${match.from_value} to ${match.to_value}`;
        setApprovalLevel(label);
        return;
      }
    }

    if (thresholdType === 'approve_all') {
      setApprovalLevel('approve_all');
      return;
    }

    setApprovalLevel(defaultLabel);
  }, [member, threshold, open, getDefaultThresholdLabel]);

  const hasChanged = useMemo(() => {
    if (!member) return false;

    const memberPermissions = member.permissions || {};
    const initialEnabled = memberPermissions.allApprovalPermissions ?? false;
    const initialTender = memberPermissions.tender_recommendation ?? false;
    const initialTenderApprovals = memberPermissions.tender_inquiry_approval ?? false;
    const initialSubcontractor =
      memberPermissions.subcontractor_list_approval ?? false;
    const initialOrder =
      memberPermissions.approval_threshold?.hasPermission ?? false;

    let permissionsChanged =
      permissions.enabled !== initialEnabled ||
      permissions.orderApprovals !== initialOrder;

    // Only compare tender recommendations if feature flag is enabled
    if (hasTenderRecommendation) {
      permissionsChanged =
        permissionsChanged ||
        permissions.tenderRecommendations !== initialTender;
    }

    // Only compare subcontractor approvals if feature flag is enabled
    if (hasSubcontractorApproval) {
      permissionsChanged =
        permissionsChanged ||
        permissions.subcontractorApprovals !== initialSubcontractor;
    }

    // Only compare tender recommendations if feature flag is enabled
    if (hasTenderApproval) {
      permissionsChanged =
        permissionsChanged || permissions.tenderApprovals !== initialTenderApprovals;
    }
    const approval_threshold = memberPermissions.approval_threshold;
    const thresholdData = approval_threshold?.threshold;
    const thresholdType = thresholdData?.type;
    let initialApprovalLevel = getDefaultThresholdLabel();

    if (thresholdType === 'threshold_range' && thresholdData) {
      const match = threshold?.find((item) => {
        const isOverValue =
          item.to_value == null &&
          thresholdData.to_value == null &&
          Number(item.from_value) === Number(thresholdData.from_value);

        const isSameRange =
          Number(item.from_value) === Number(thresholdData.from_value) &&
          Number(item.to_value) === Number(thresholdData.to_value);

        return isOverValue || isSameRange;
      });

      if (match) {
        initialApprovalLevel =
          match.to_value == null
            ? `Over ${match.from_value}`
            : `${match.from_value} to ${match.to_value}`;
      }
    } else if (thresholdType === 'approve_all') {
      initialApprovalLevel = 'approve_all';
    }

    const approvalLevelChanged = approvalLevel !== initialApprovalLevel;

    return permissionsChanged || approvalLevelChanged;
  }, [
    member,
    permissions,
    approvalLevel,
    threshold,
    getDefaultThresholdLabel,
    hasTenderRecommendation,
    hasTenderApproval,
    hasSubcontractorApproval,
  ]);

  const handleConfirm = useCallback(() => {
    const payload = {
      allApprovals: permissions.enabled,
      orderApprovalsEnabled: permissions.orderApprovals,
      orderApprovalsType:
        approvalLevel === 'approve_all' ? 'approve_all' : 'threshold_range',
      thresholdIds:
        approvalLevel !== 'approve_all'
          ? (() => {
              const matchingThreshold = threshold.find((th) => {
                if (th.to_value == null) {
                  return `Over ${th.from_value}` === approvalLevel;
                }
                return `${th.from_value} to ${th.to_value}` === approvalLevel;
              });
              return matchingThreshold ? [Number(matchingThreshold.id)] : [];
            })()
          : [],
    };

    if (hasTenderRecommendation) {
      payload.tenderRecommendation = permissions.tenderRecommendations;
    }
    if (hasTenderApproval) {
      payload.tenderApprovals = permissions.tenderApprovals;
    }

    if (hasSubcontractorApproval) {
      payload.subcontractorListApproval = permissions.subcontractorApprovals;
    }

    onConfirm(payload);
    onClose();
  }, [
    permissions,
    approvalLevel,
    threshold,
    onConfirm,
    onClose,
    hasTenderRecommendation,
    hasSubcontractorApproval,
  ]);

  const openThresholdModal = () => {
    onClose();
    openNewThresholdModal();
  };

  const resetPermission = () => {
    setPermissions({
      enabled: false,
      tenderRecommendations: false,
      tenderApprovals: false,
      subcontractorApprovals: false,
      orderApprovals: false,
    });
    const defaultLabel = getDefaultThresholdLabel();
    if (defaultLabel) {
      setApprovalLevel(defaultLabel);
    }
  };

  const selectStyles = {
    width: '100%',
    '& .MuiOutlinedInput-input': {
      padding: '8.5px 14px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: christmasSilver,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
      data-testid="edit-permission-modal"
    >
      <DialogTitle
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" component="span" fontWeight="normal">
            {t('permissions')}
          </Typography>
          <Typography
            variant="h6"
            component="span"
            fontWeight="bold"
            sx={{ ml: 1 }}
          >
            {member?.display_name}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
          data-testid="edit-permission-close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box
          role="table"
          sx={{
            m: 3,
            border: `1px solid ${grayDark}`,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Grid2
            container
            sx={{
              py: 1.5,
              px: 2,
              fontWeight: 600,
              color: 'text.secondary',
              borderBottom: `1px solid ${grayDark}`,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Grid2 item xs={6}>
              <Typography variant="body2" fontWeight={600}>
                {t('approval-process')}
              </Typography>
            </Grid2>
            <Grid2 item xs={4}>
              <Typography variant="body2" fontWeight={600}>
                {t('value-threshold')}
              </Typography>
            </Grid2>
            <Grid2 item xs={2} sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={600}>
                {t('enable')}
              </Typography>
            </Grid2>
          </Grid2>

          <Grid2
            container
            alignItems="center"
            sx={{
              p: 2,
              borderBottom: `1px solid ${grayDark}`,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Grid2 item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  {t('all-approvals')}
                </Typography>
                <Tooltip
                  title={t('all-approvals-tooltip')}
                  placement="top"
                  arrow
                >
                  <InfoOutlinedIcon
                    fontSize="small"
                    sx={{ color: 'text.secondary' }}
                  />
                </Tooltip>
              </Box>
            </Grid2>
            <Grid2 item xs={4} />
            <Grid2
              item
              xs={2}
              sx={{ display: 'flex', justifyContent: 'flex-end' }}
            >
              <Switch
                size="small"
                checked={permissions.enabled}
                data-testid="permission-all-approvals-switch"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPermissions({
                    enabled: checked,
                    tenderRecommendations: checked,
                    tenderApprovals: checked,
                    subcontractorApprovals: checked,
                    orderApprovals: checked && hasApprovalOptions,
                  });
                }}
              />
            </Grid2>
          </Grid2>

          {hasSubcontractorApproval && (
            <Grid2
              container
              alignItems="center"
              sx={{
                p: 2,
                pl: 5,
                borderBottom: `1px solid ${grayDark}`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Grid2 item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {t('supplier-approvals')}
                  </Typography>
                  <Tooltip
                    title={t('supplier-approvals-tooltip')}
                    placement="top"
                    arrow
                  >
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ color: 'text.secondary' }}
                    />
                  </Tooltip>
                </Box>
              </Grid2>
              <Grid2 item xs={4} />
              <Grid2
                item
                xs={2}
                sx={{ display: 'flex', justifyContent: 'flex-end' }}
              >
                <Switch
                  size="small"
                  checked={permissions.subcontractorApprovals}
                  data-testid="permission-supplier-approvals-switch"
                  onChange={(e) => {
                    setPermissions((prev) => ({
                      ...prev,
                      subcontractorApprovals: e.target.checked,
                    }));
                  }}
                />
              </Grid2>
            </Grid2>
          )}

          {hasTenderRecommendation && (
            <Grid2
              container
              alignItems="center"
              sx={{
                p: 2,
                pl: 5,
                borderBottom: `1px solid ${grayDark}`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Grid2 item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {t('tender-recommendations')}
                  </Typography>
                  <Tooltip
                    title={t('tender-recommendations-tooltip')}
                    placement="top"
                    arrow
                  >
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ color: 'text.secondary' }}
                    />
                  </Tooltip>
                </Box>
              </Grid2>
              <Grid2 item xs={4} />
              <Grid2
                item
                xs={2}
                sx={{ display: 'flex', justifyContent: 'flex-end' }}
              >
                <Switch
                  size="small"
                  checked={permissions.tenderRecommendations}
                  data-testid="permission-tender-recommendations-switch"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPermissions((prev) => {
                      const newState = {
                        ...prev,
                        tenderRecommendations: checked,
                      };
                      newState.enabled =
                        newState.tenderRecommendations && newState.orderApprovals && newState.tenderApprovals;
                      return newState;
                    });
                  }}
                />
              </Grid2>
            </Grid2>
          )}
          {hasTenderApproval && (
            <Grid2
              container
              alignItems="center"
              sx={{
                p: 2,
                pl: 5,
                borderBottom: `1px solid ${grayDark}`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Grid2 item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {t('tender-approvals')}
                  </Typography>
                  <Tooltip
                    title={t('tender-approvals-tooltip')}
                    placement="top"
                    arrow
                  >
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ color: 'text.secondary' }}
                    />
                  </Tooltip>
                </Box>
              </Grid2>
              <Grid2 item xs={4} />
              <Grid2
                item
                xs={2}
                sx={{ display: 'flex', justifyContent: 'flex-end' }}
              >
                <Switch
                  size="small"
                  checked={permissions.tenderApprovals}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPermissions((prev) => {
                      const newState = {
                        ...prev,
                        tenderApprovals: checked,
                      };
                      newState.enabled = newState.tenderRecommendations && newState.orderApprovals && newState.tenderApprovals;
                      return newState;
                    });
                  }}
                />
              </Grid2>
            </Grid2>
          )}

          <Grid2
            container
            alignItems="center"
            sx={{
              p: 2,
              pl: 5,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Grid2 item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {t('order-approvals')}
                </Typography>
                <Tooltip
                  title={t('order-approvals-tooltip')}
                  placement="top"
                  arrow
                >
                  <InfoOutlinedIcon
                    fontSize="small"
                    sx={{ color: 'text.secondary' }}
                  />
                </Tooltip>
              </Box>
            </Grid2>
            <Grid2 item xs={4}>
              <PermissionRow>
                <FormControl fullWidth variant="outlined">
                  {hasApprovalOptions ? (
                    <Select
                      value={approvalLevel}
                      onChange={(e) => setApprovalLevel(e.target.value)}
                      sx={selectStyles}
                      disabled={!permissions.orderApprovals}
                      data-testid="permission-order-approvals-select"
                    >
                      {getApprovalOptions(threshold)}
                      <MenuItem value="approve_all">
                        {t('approve_all')}
                      </MenuItem>
                    </Select>
                  ) : (
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      onClick={openThresholdModal}
                      data-testid="permission-setup-threshold-link"
                    >
                      {t('set-up-threshold-groups')}
                    </Typography>
                  )}
                </FormControl>
              </PermissionRow>
            </Grid2>
            <Grid2
              item
              xs={2}
              sx={{ display: 'flex', justifyContent: 'flex-end' }}
            >
              {permissions.enabled && !threshold?.length && (
                <Tooltip
                  title={i18next.t('disabled-order-approvals-switch-tooltip')}
                >
                  <IconButton
                    disableRipple
                    sx={{
                      p: 0,
                      color: clinkOrange,
                    }}
                  >
                    <WarningAmberIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Switch
                size="small"
                disabled={!threshold?.length}
                checked={permissions.orderApprovals}
                data-testid="permission-order-approvals-switch"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPermissions((prev) => {
                    const newState = { ...prev, orderApprovals: checked };
                    newState.enabled =
                      newState.tenderRecommendations && newState.orderApprovals && newState.tenderApprovals;
                    return newState;
                  });
                }}
              />
            </Grid2>
          </Grid2>
        </Box>
      </DialogContent>

      {hasApprovalOptions && (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pt: 0 }}>
          <ReplayOutlinedIcon
            fontSize="small"
            sx={{ color: 'text.secondary', mr: 0.5 }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={resetPermission}
            data-testid="permission-reset-link"
          >
            {t('reset-default-permissions')}
          </Typography>
        </Box>
      )}
      <DialogActions
        sx={{
          p: 2,
          pb: 3,
          borderTop: `1px solid ${grayDark}`,
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <Button onClick={onClose} variant="outlined" data-testid="edit-permission-cancel-button">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!hasChanged}
          color="primary"
          data-testid="edit-permission-confirm-button"
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default EditPermissionModal;
