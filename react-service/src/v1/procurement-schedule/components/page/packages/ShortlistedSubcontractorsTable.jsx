import React, { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import CircularProgress from '@mui/material/CircularProgress';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import ApprovalExpandablePanel from 'v2/apps/shared/components/approval-expandable-panel';
import ApproverTooltip from 'v2/apps/shared/components/approver-tooltip/approverTooltip';
import { CONSTANTS } from 'clink-components';
import {
  white,
  christmasSilver,
  grayLight,
  clinkRed,
  whiteSmoke,
  japaneseIndigo,
  gray2,
} from 'v2/constants/colors';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import {
  DRAFT,
  REJECTION_ACKNOWLEDGED,
  getStatusValue,
  getApproverRowsForUser,
  isApprovableByUser,
  isSelectableForApproval,
  isCurrentUserAnApprover,
  isPending,
} from 'v2/helpers/status/approval';
import RejectModal from 'v1/document-creator/components/page/header/RejectModal';
import LogsModal from 'v2/apps/shared/components/logs-modal';
import i18next from 'i18next';
import RejectionAcknowledgeModal from 'v2/apps/clink/pages/projects/RejectionAcknowledgeModal';

const {
  successGreen,
  lightGray,
  darkCharcoal,
  webOrange,
  successDarkGreen,
  mediumGray,
  ghostWhite,
} = CONSTANTS.colors.general;

const getStatusLabel = (status) => getStatusValue(status) || i18next.t('draft');

const getSubcontractorId = (subcontractor) => subcontractor?.id;

const getStatusColor = (status) => {
  const statusValue = getStatusValue(status);
  const statusLower = statusValue?.toLowerCase() || '';
  const statusColors = {
    pending: { bg: webOrange, color: darkCharcoal },
    approved: { bg: successGreen, color: successDarkGreen },
    rejected: { bg: clinkRed, color: whiteSmoke },
    draft: { bg: lightGray, color: mediumGray },
  };
  return statusColors[statusLower] || statusColors.draft;
};

const isCurrentUserSubmitter = (subcontractor, userId) => {
  if (!userId || !subcontractor) return false;
  return String(subcontractor.submitted_by.id) === String(userId);
};

const mapMultiApprovalsToApproverList = (isLevel, approvals = {}) => {
  if (!approvals || typeof approvals !== 'object') return [];

  return Object.values(approvals).map((level) => {
    const approvers = Array.isArray(level?.approvers) ? level.approvers : [];
    return {
      level_number: level?.level ?? null,
      status: level?.status ?? null,
      isLevel,
      rule: level?.rule ?? null,
      approvers: approvers.map((approver) => {
        const user = approver?.user ?? {};
        const status = approver?.status ?? {};

        const firstName = user?.display_name ?? user?.firstName ?? '';
        const lastName = user?.lastname ?? '';

        return {
          id: approver?.id ? String(approver.id) : null,
          role_label: user?.role?.label ?? user?.account_role_label ?? null,
          approver_user: {
            display_name: `${firstName} ${lastName}`.trim(),
            email: user?.email ?? null,
            initials: (
              (firstName?.[0] ?? '') + (lastName?.[0] ?? '')
            ).toUpperCase(),
          },
          is_level_satisfied_by_higher_authority:
            approver?.is_level_satisfied_by_higher_authority ?? null,
          is_level_satisfied_by_self_approved:
            approver?.is_level_satisfied_by_self_approved ?? null,
          is_satisfied_by_higher_authority:
            approver?.is_satisfied_by_higher_authority ?? null,
          is_satisfied_by_self_approved:
            approver?.is_satisfied_by_self_approved ?? null,
          status: {
            value: status?.label?.toLowerCase() ?? null,
            label: status?.label ?? null,
          },
          approval_requested_at: approver?.created_at ?? null,
          actioned_at: approver?.updated_at ?? null,
        };
      }),
    };
  });
};

const mapSingleApprovalsToApproverList = (isLevel, approvals = []) => {
  if (!Array.isArray(approvals)) return [];

  return [
    {
      level_number: null,
      status: null,
      isLevel,
      approvers: approvals.map((approver) => {
        const user = approver?.user ?? {};
        const status = approver?.status ?? {};

        const firstName = user?.display_name ?? user?.firstName ?? '';
        const lastName = user?.lastname ?? '';

        return {
          id: approver?.id ? String(approver.id) : null,

          role_label: user?.role?.label ?? user?.account_role_label ?? null,
          is_level_satisfied_by_higher_authority:
            approver?.is_level_satisfied_by_higher_authority ?? null,
          is_level_satisfied_by_self_approved:
            approver?.is_level_satisfied_by_self_approved ?? null,
          is_satisfied_by_higher_authority:
            approver?.is_satisfied_by_higher_authority ?? null,
          is_satisfied_by_self_approved:
            approver?.is_satisfied_by_self_approved ?? null,

          approver_user: {
            display_name: [firstName, lastName].filter(Boolean).join(' '),
            email: user?.email ?? null,
            initials: (
              (firstName?.[0] ?? '') + (lastName?.[0] ?? '')
            ).toUpperCase(),
          },

          status: {
            value: status?.label?.toLowerCase() ?? null,
            label: status?.label ?? null,
          },

          approval_requested_at: approver?.created_at ?? null,
          actioned_at: approver?.updated_at ?? null,
        };
      }),
    },
  ];
};

const getApproverNames = (approvals, isLevel) => {
  if (!approvals) return [];

  if (isLevel && typeof approvals === 'object' && !Array.isArray(approvals)) {
    return Object.entries(approvals)
      .map(([key, level]) => {
        const approvers = Array.isArray(level?.approvers)
          ? level.approvers
          : [];
        const names = approvers
          .map((approver) => approver?.user?.display_name ?? '')
          .filter(Boolean)
          .join(', ');

        return {
          levelNumber: level.level || key,
          names,
        };
      })
      .filter((item) => item.names);
  }

  if (!isLevel && Array.isArray(approvals)) {
    const names = approvals
      .map((approver) => approver?.user?.display_name ?? '')
      .filter(Boolean)
      .join(', ');

    return names ? [{ levelNumber: null, names }] : [];
  }

  return [];
};

const getRejectionReasons = (approvals, isLevel) => {
  if (!approvals) return '';

  if (isLevel && typeof approvals === 'object' && !Array.isArray(approvals)) {
    const reasons = Object.values(approvals)
      .filter((level) => level?.status === 'rejected')
      .flatMap((level) =>
        (level?.approvers || [])
          .filter((a) => a?.status?.label === 'Rejected' && a?.comment)
          .map((a) => a.comment),
      );

    return reasons.join(', ');
  }

  if (!isLevel && Array.isArray(approvals)) {
    const reasons = approvals
      .filter((a) => a?.status?.label === 'Rejected' && a?.comment)
      .map((a) => a.comment);

    return reasons.join(', ');
  }

  return '';
};

const ShortlistedSubcontractorsTable = ({
  data = [],
  projectId,
  tenderId,
  dispatch,
  clinkAccount,
  bulkUpdateProjectHistory,
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const { showSnackbar } = useSnackbar();
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [subcontractorListItem, setsubcontractorListItem] = useState(null);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [subcontractorLogs, setSubcontractorLogs] = useState(null);
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [rejectionSubcontractor, setRejectionSubcontractor] = useState(null);
  const [approvingSubId, setApprovingSubId] = useState(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [acknowledgeSubmitting, setAcknowledgeSubmitting] = useState(false);
  const [selectedSubcontractorForAction, setSelectedSubcontractorForAction] =
    useState(null);
  const [rejectionAnchorEl, setRejectionAnchorEl] = useState(null);
  const [expandedRow, setExpandedRow] = React.useState(null);

  // Selection exists only for the approver: a requester's drafts are submitted
  // project-wide via Bulk Request Supplier Approval, never ticked here.
  const approvableItems = data.filter((item) =>
    isApprovableByUser(item, clinkAccount?.user?.id),
  );
  const approvableCount = approvableItems.length;
  const selectedCount = selected.length;

  const bulkHintRef = useRef(null);
  const [bulkHintTruncated, setBulkHintTruncated] = useState(false);

  // The hint takes its natural width; only if the viewport squeezes it far
  // enough to ellipsize do we attach a tooltip with the full sentence.
  useEffect(() => {
    const chip = bulkHintRef.current;
    if (!chip) return undefined;
    // The label is what clips; fall back to the root if MUI's class changes.
    const target = chip.querySelector('.MuiChip-label') ?? chip;

    const checkTruncation = () =>
      setBulkHintTruncated(target.scrollWidth > target.clientWidth + 1);

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(chip);
    return () => observer.disconnect();
  }, []);

  const handleExpandClick = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const fieldsData = {
    title: i18next.t('reject-shortlisted-title'),
    content: i18next.t('reject-shortlisted-description', {
      name:
        selectedSubcontractorForAction?.length === 1
          ? selectedSubcontractorForAction[0]?.name
          : `${selectedSubcontractorForAction?.length || 0} suppliers`,
    }),
    placeholder: i18next.t('reject-shortlisted-placeholder'),
    successMessage: i18next.t('reject-shortlisted-success'),
    errorMessage: i18next.t('reject-shortlisted-error'),
  };

  const accordionSx = {
    boxShadow: 'none',
    border: 'none',
    '&:before': { display: 'none' },
  };

  const approverActionButtonSx = {
    backgroundColor: successGreen,
    '&:hover': { backgroundColor: successDarkGreen },
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: '4px',
  };

  const accordionSummarySx = {
    padding: 0,
    minHeight: 48,
    '& .MuiAccordionSummary-content': {
      margin: '12px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      position: 'static',
      transform: 'none',
      marginLeft: 1,
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(180deg)',
    },
  };

  const handleReasonClick = (event, reason, subcontractor) => {
    event.stopPropagation();
    setPopoverAnchor(event.currentTarget);
    setSelectedReason(reason);
    setRejectionSubcontractor(subcontractor || null);
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null);
    setSelectedReason('');
    setRejectionSubcontractor(null);
  };

  const handleRejectionPopoverClose = () => {
    setRejectionAnchorEl(null);
    setRejectionSubcontractor(null);
  };

  const handleAcknowledge = useCallback(() => {
    if (!projectId || !tenderId || !rejectionSubcontractor) return;
    const shortlistedId = getSubcontractorId(rejectionSubcontractor);
    if (!shortlistedId) return;

    setAcknowledgeSubmitting(true);
    dispatch(
      actions.acknowledgeRejection({
        projectId,
        tenderId,
        shortlistedSubcontractorId: shortlistedId,
      }),
    )
      .unwrap()
      .then(() => {
        showSnackbar(i18next.t('rejection-acknowledged-success'), 'success');
        handleRejectionPopoverClose();
        return dispatch(
          actions.getProjectProcurement({ pid: projectId }),
        ).unwrap();
      })
      .catch((error) => {
        showSnackbar(
          error?.message || i18next.t('rejection-acknowledged-error'),
          'error',
        );
      })
      .finally(() => {
        setAcknowledgeSubmitting(false);
      });
  }, [
    projectId,
    tenderId,
    rejectionSubcontractor,
    showSnackbar,
    dispatch,
    actions,
  ]);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedSubId(null);
  }, []);

  const triggerBulkUpdateHistoryForApprovedSids = useCallback(
    (sids, subcontractorList) => {
      if (!sids?.length) {
        return false;
      }

      const mappedValues = subcontractorList
        .filter((sub) => sids.includes(sub?.subcontractor_id))
        .map((sub) => ({
          value: sub?.subcontractor_id,
          label: sub?.name,
        }));

      bulkUpdateProjectHistory(
        {
          supplyChain: mappedValues,
        },
        null,
        tenderId,
        true,
      );

      return dispatch(
        actions.getProjectProcurement({ pid: projectId }),
      ).unwrap();
    },
    [actions, dispatch, projectId, tenderId, bulkUpdateProjectHistory],
  );

  const handleApproveOrRejectSubcontractor = useCallback(
    (subcontractors, status, comment = '') => {
      const subcontractorList = Array.isArray(subcontractors)
        ? subcontractors
        : [subcontractors];
      let approvals = [];

      subcontractorList.forEach((subcontractor) => {
        const subId = getSubcontractorId(subcontractor);

        const mapped = getApproverRowsForUser(
          subcontractor,
          clinkAccount?.user?.id,
          { pendingOnly: false },
        ).map((approver) => ({
          approval_id: approver?.id,
          shortlisted_subcontractor_id: subId,
        }));

        approvals = [...approvals, ...mapped];
      });

      if (!projectId || !tenderId || approvals.length === 0) return;

      if (status?.toLowerCase() === 'approved') {
        setApprovingSubId(getSubcontractorId(subcontractorList[0]));
      }

      if (status?.toLowerCase() === 'rejected') {
        setRejectSubmitting(true);
      }

      dispatch(
        actions.approveOrRejectShortlistedSubcontractor({
          projectId,
          tenderId,
          data: {
            approvals,
            status,
            comment,
          },
        }),
      )
        .unwrap()
        .then((res) => {
          const sids = res?.sids || [];
          const triggered = triggerBulkUpdateHistoryForApprovedSids(
            sids,
            subcontractorList,
          );

          if (status?.toLowerCase() === 'approved' && triggered) {
            showSnackbar(
              i18next.t('subcontractors-added-to-schedule'),
              'success',
            );
          } else {
            showSnackbar(
              i18next.t('supplier-action-success', {
                action: status.toLowerCase(),
              }),
              'success',
            );
          }

          return (
            triggered ||
            dispatch(actions.getProjectProcurement({ pid: projectId })).unwrap()
          );
        })
        .then(() => {
          setRejectModalOpen(false);
          setSelectedSubcontractorForAction(null);
          // `selected` holds row objects; the refresh above replaces them, so
          // anything left here is stale and would keep the buttons enabled.
          setSelected([]);
        })
        .catch((error) => {
          showSnackbar(
            error?.message ||
              i18next.t('supplier-action-error', {
                action: `${status.toLowerCase()}ed`,
              }),
            'error',
          );
        })
        .finally(() => {
          if (status?.toLowerCase() === 'approved') {
            setApprovingSubId(null);
          }
          if (status?.toLowerCase() === 'rejected') {
            setRejectSubmitting(false);
          }
        });
    },
    [
      actions,
      dispatch,
      projectId,
      tenderId,
      showSnackbar,
      clinkAccount,
      triggerBulkUpdateHistoryForApprovedSids,
    ],
  );

  const handleSubcontractorWithdrawal = useCallback(
    (subcontractor) => {
      const subId = getSubcontractorId(subcontractor);
      if (!subId || !projectId || !tenderId) return;
      dispatch(
        actions.withdrawShortlistedSubcontractorApproval({
          projectId,
          tenderId,
          shortlistedSubcontractorId: subId,
        }),
      )
        .unwrap()
        .then(() => {
          showSnackbar(i18next.t('supplier-withdraw-success'), 'success');
          if (projectId) {
            return dispatch(
              actions.getProjectProcurement({ pid: projectId }),
            ).unwrap();
          }
          return undefined;
        })
        .then(() => {
          handleMenuClose();
        })
        .catch((error) => {
          showSnackbar(
            error?.message || i18next.t('supplier-withdraw-error'),
            'error',
          );
        });
    },
    [actions, dispatch, projectId, tenderId, showSnackbar, handleMenuClose],
  );

  const handleApproveSubcontractor = useCallback(
    (subcontractor) => {
      handleApproveOrRejectSubcontractor(subcontractor, 'Approved', '');
    },
    [handleApproveOrRejectSubcontractor],
  );

  const handleRejectClick = useCallback((subcontractor) => {
    if (Array.isArray(subcontractor)) {
      setSelectedSubcontractorForAction(subcontractor);
    } else if (subcontractor) {
      setSelectedSubcontractorForAction([subcontractor]);
    }

    setRejectModalOpen(true);
  }, []);

  const handleSelectAllClick = (event) => {
    setSelected(event?.target?.checked ? approvableItems : []);
  };

  const handleSelectRow = (subcontractor) => {
    setSelected((prev) =>
      prev.includes(subcontractor)
        ? prev.filter((row) => row !== subcontractor)
        : [...prev, subcontractor],
    );
  };

  const handleRejectSubmit = useCallback(
    (comment) => {
      if (selectedSubcontractorForAction?.length) {
        handleApproveOrRejectSubcontractor(
          selectedSubcontractorForAction,
          'Rejected',
          comment || '',
        );
      }
    },
    [handleApproveOrRejectSubcontractor, selectedSubcontractorForAction],
  );

  const handleMenuOpen = (event, subId, subcontractor) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedSubId(subId);
    setsubcontractorListItem(subcontractor);
  };

  const viewLogs = useCallback(
    (subcontractor) => {
      const subId = getSubcontractorId(subcontractor);

      if (!subId || !projectId || !tenderId) return;

      dispatch(
        actions.getShortlistedSubcontractorLogs({
          projectId,
          tenderId,
          shortlistedSubcontractorId: subId,
        }),
      )
        .unwrap()
        .then((payload) => {
          setSubcontractorLogs(payload);
          setOpenLogModal(true);
        })
        .catch((error) => {
          const errorMessage = error?.message;
          showSnackbar(errorMessage || i18next.t('failed-fetch-logs'), 'error');
        });
    },
    [actions, dispatch, projectId, tenderId, showSnackbar],
  );

  const handleSendShortlistedReminder = useCallback(
    ({ approver_id, shortlistedSubcontractorId }) => {
      if (!projectId || !tenderId)
        return Promise.reject(new Error('Missing project or tender ID'));
      return dispatch(
        actions.sendShortlistedSubcontractorReminder({
          projectId,
          tenderId,
          shortlistedSubcontractorId,
          approverId: approver_id,
        }),
      );
    },
    [actions, dispatch, projectId, tenderId],
  );

  const handleViewLogs = () => {
    if (selectedSubId) {
      const subcontractor =
        subcontractorListItem ||
        data.find((s) => getSubcontractorId(s) === selectedSubId);
      viewLogs(subcontractor);
    }
    handleMenuClose();
  };

  const handleRemoveClick = (sub) => {
    setsubcontractorListItem(sub);
    setRemoveDialogOpen(true);
    handleMenuClose();
  };

  const handleRemoveConfirm = () => {
    if (!subcontractorListItem) return;

    const shortlistedId = getSubcontractorId(subcontractorListItem);
    if (!shortlistedId || !projectId || !tenderId) return;

    const removedName = subcontractorListItem?.name || '';

    setRemoving(true);
    dispatch(
      actions.deleteShortlistedSubcontractor({
        projectId,
        tenderId,
        shortlistedSubcontractorId: shortlistedId,
      }),
    )
      .unwrap()
      .then(() => {
        setRemoveDialogOpen(false);
        setsubcontractorListItem(null);
        showSnackbar(
          i18next.t('remove-from-shortlist-success', { name: removedName }),
          'success',
        );
        // The table renders state.project.shortlistedSubcontractors, which only
        // this thunk writes, so without the refetch the removed row lingers
        // until a page reload.
        return dispatch(actions.fetchShortlistedSubcontractors(projectId));
      })
      .catch(() => {
        showSnackbar(i18next.t('remove-from-shortlist-error'), 'error');
      })
      .finally(() => {
        setRemoving(false);
      });
  };

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false);
    setsubcontractorListItem(null);
  };

  const handleOpen = (event, subcontractor) => {
    event.stopPropagation();
    setRejectionAnchorEl(event.currentTarget);
    setRejectionSubcontractor(subcontractor);
  };

  const renderAccordionSummary = (titleFontSize) => (
    <AccordionSummary component="div" sx={accordionSummarySx}>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 1 }}>
        <Typography
          variant="p"
          sx={{
            fontSize: titleFontSize,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {i18next.t('shortlisted-suppliers')}
        </Typography>
        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
          <ExpandMoreIcon />
        </Box>
      </Box>
      {approvableCount > 0 ? (
        // The approver actions replace the hint: this package has rows awaiting them.
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            data-testid="supplier-bulk-approve-btn"
            variant="contained"
            color="primary"
            size="small"
            disabled={selectedCount === 0}
            onClick={(e) => {
              e.stopPropagation();
              handleApproveOrRejectSubcontractor(selected, 'Approved', '');
            }}
            sx={approverActionButtonSx}
          >
            {i18next.t('approve')}
          </Button>
          <Button
            data-testid="supplier-bulk-reject-btn"
            variant="outlined"
            color="secondary"
            size="small"
            disabled={selectedCount === 0}
            onClick={(e) => {
              e.stopPropagation();
              handleRejectClick(selected);
            }}
            sx={{ borderRadius: 1 }}
          >
            {i18next.t('reject')}
          </Button>
        </Box>
      ) : (
        /* Requests are raised project-wide from Bulk Request Supplier Approval. */
        <Tooltip
          title={bulkHintTruncated ? i18next.t('use-bulk-request-supplier-approval') : ''}
        >
          <Chip
            ref={bulkHintRef}
            data-testid="supplier-bulk-request-hint"
            variant="outlined"
            icon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
            label={i18next.t('use-bulk-request-supplier-approval')}
            sx={{
              height: 32,
              // Hold the full sentence: the heading yields space before we do.
              flexShrink: 0,
              maxWidth: '100%',
              backgroundColor: white,
              borderColor: christmasSilver,
              color: mediumGray,
              fontSize: 13,
              '& .MuiChip-icon': { color: mediumGray, ml: 1.25, mr: -0.25 },
              '& .MuiChip-label': { px: 1.25 },
            }}
          />
        </Tooltip>
      )}
    </AccordionSummary>
  );

  // Empty state is here!!
  if (!data || data.length === 0) {
    return (
      <Box sx={{ mt: 1, mb: 2 }}>
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          sx={accordionSx}
        >
          {renderAccordionSummary(18)}
          <AccordionDetails sx={{ padding: 0 }}>
            <Typography variant="body1" color="text.secondary">
              {i18next.t('no-shortlisted-suppliers-yet')}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  }
  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={accordionSx}
      >
        {renderAccordionSummary(18)}
        <AccordionDetails sx={{ padding: '16px 0' }}>
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: `0px 1px 3px ${grayLight}`,
              border: `1px solid ${christmasSilver}`,
              backgroundColor: ghostWhite,
            }}
          >
            <Table aria-label="shortlisted subcontractors table">
              <TableHead sx={{ backgroundColor: 'white' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    {approvableCount > 0 && (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="right"
                      >
                        <Checkbox
                          data-testid="supplier-select-all-checkbox"
                          color="primary"
                          indeterminate={
                            selectedCount > 0 && selectedCount < approvableCount
                          }
                          checked={selectedCount === approvableCount}
                          onChange={handleSelectAllClick}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>
                    {i18next.t('supplier-name')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>
                    {i18next.t('status')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>
                    {i18next.t('requested-approver')}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    {i18next.t('actions')}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody sx={{ backgroundColor: 'white' }}>
                {data.map((subcontractor) => {
                  const {
                    name,
                    status,
                    approver_notes: rejectionReason,
                    approvals,
                    isLevel,
                  } = subcontractor;
                  const approverList = isLevel
                    ? mapMultiApprovalsToApproverList(isLevel, approvals)
                    : mapSingleApprovalsToApproverList(isLevel, approvals);

                  const requestedApprover = getApproverNames(
                    approvals,
                    isLevel,
                  );
                  const subId = getSubcontractorId(subcontractor);
                  const statusLabel = getStatusLabel(status);
                  const colors = getStatusColor(statusLabel);
                  const isApproving = approvingSubId === subId;
                  const isCurrentUserApproverForItem = isCurrentUserAnApprover(
                    subcontractor,
                    clinkAccount?.user?.id,
                  );
                  const isRowApprovable = isApprovableByUser(
                    subcontractor,
                    clinkAccount?.user?.id,
                  );

                  return (
                    <Fragment key={subId}>
                      <TableRow
                        key={subId}
                        hover
                        tabIndex={-1}
                        sx={{
                          backgroundColor: white,
                          '&:hover': {
                            backgroundColor: grayLight,
                          },
                        }}
                      >
                        <TableCell
                          padding="checkbox"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="right"
                          >
                            {![DRAFT, REJECTION_ACKNOWLEDGED].includes(
                              statusLabel,
                            ) && (
                              <IconButton
                                data-testid={`supplier-expand-btn-${subId}`}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExpandClick(subId);
                                }}
                              >
                                {expandedRow === subId ? (
                                  <KeyboardArrowUpIcon />
                                ) : (
                                  <KeyboardArrowDownIcon />
                                )}
                              </IconButton>
                            )}
                            {isRowApprovable && (
                              <Checkbox
                                data-testid={`supplier-checkbox-${subId}`}
                                color="primary"
                                checked={selected.includes(subcontractor)}
                                onChange={() => handleSelectRow(subcontractor)}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 14,
                                fontWeight: 600,
                                bgcolor: successGreen,
                                color: white,
                              }}
                            >
                              {name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip
                              data-testid={`supplier-status-chip-${subId}`}
                              label={
                                statusLabel === 'Pending'
                                  ? i18next.t('pending-approval')
                                  : statusLabel
                              }
                              size="small"
                              sx={{
                                backgroundColor: colors.bg,
                                color: colors.color,
                                fontWeight: 500,
                                fontSize: 12,
                              }}
                            />
                            {statusLabel?.toLowerCase() === 'rejected' && (
                              <IconButton
                                data-testid={`supplier-rejection-info-btn-${subId}`}
                                sx={{ color: clinkRed }}
                                onClick={(e) => handleOpen(e, subcontractor)}
                              >
                                <InfoOutlinedIcon />
                              </IconButton>
                            )}

                            {isCurrentUserApproverForItem &&
                              statusLabel?.toLowerCase() === 'rejected' &&
                              rejectionReason && (
                                <Typography
                                  component="span"
                                  color="primary"
                                  sx={{
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                  }}
                                  onClick={(e) =>
                                    handleReasonClick(
                                      e,
                                      rejectionReason,
                                      subcontractor,
                                    )
                                  }
                                >
                                  {i18next.t('reason')}
                                </Typography>
                              )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              requestedApprover.length > 0 ? (
                                <ApproverTooltip
                                  approvers={requestedApprover}
                                />
                              ) : (
                                ''
                              )
                            }
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                maxWidth: '150px',
                              }}
                            >
                              {requestedApprover
                                .map((a) => a.names)
                                .join(', ') || '-'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'end',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {isCurrentUserApproverForItem &&
                              statusLabel?.toLowerCase() === 'pending' && (
                                <>
                                  <Button
                                    data-testid={`supplier-approve-btn-${subId}`}
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveSubcontractor(subcontractor);
                                    }}
                                    disabled={isApproving}
                                    startIcon={
                                      isApproving ? (
                                        <CircularProgress
                                          size={16}
                                          color="inherit"
                                        />
                                      ) : null
                                    }
                                  >
                                    {i18next.t('approve')}
                                  </Button>
                                  <Button
                                    data-testid={`supplier-reject-btn-${subId}`}
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectClick(subcontractor);
                                    }}
                                  >
                                    {i18next.t('reject')}
                                  </Button>
                                </>
                              )}
                            <IconButton
                              data-testid={`supplier-more-actions-btn-${subId}`}
                              aria-label="more actions"
                              onClick={(e) =>
                                handleMenuOpen(e, subId, subcontractor)
                              }
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {statusLabel !== 'Draft' && approverList?.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ p: 0, borderBottom: 0 }}>
                            <Collapse
                              in={expandedRow === subId}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ p: 2, backgroundColor: grayLight }}>
                                <ApprovalExpandablePanel
                                  levels={approverList}
                                  sendApprovalReminder={
                                    handleSendShortlistedReminder
                                  }
                                  entity_id={subId}
                                  entityIdKey="shortlistedSubcontractorId"
                                  canSendReminder={
                                    String(subcontractor?.submitted_by?.id) ===
                                    String(clinkAccount?.user?.id)
                                  }
                                />
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      <RejectionAcknowledgeModal
        anchorEl={rejectionAnchorEl}
        onClose={handleRejectionPopoverClose}
        width={280}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {rejectionSubcontractor && (
          <Box sx={{ p: 2 }}>
            <Typography
              variant="body2"
              sx={{
                wordBreak: 'break-word',
                maxHeight: 140,
                overflowY: 'auto',
              }}
            >
              {getRejectionReasons(
                rejectionSubcontractor.approvals,
                rejectionSubcontractor.isLevel,
              )}
            </Typography>

            {isCurrentUserSubmitter(
              rejectionSubcontractor,
              clinkAccount?.user?.id,
            ) && (
              <Box sx={{ display: 'flex', mt: 2 }}>
                <Button
                  data-testid="supplier-acknowledge-btn"
                  size="small"
                  variant="contained"
                  onClick={handleAcknowledge}
                  fullWidth
                  sx={{ borderRadius: 0 }}
                >
                  {i18next.t('acknowledge', { defaultValue: 'Acknowledge' })}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </RejectionAcknowledgeModal>
      <RejectModal
        fields={fieldsData}
        type="procurement_schedule"
        open={rejectModalOpen}
        onClose={() => {
          setSelectedSubcontractorForAction([]);
          setRejectModalOpen(false);
        }}
        onReject={handleRejectSubmit}
        projectSlug="procurement_schedule"
        isSubmitting={rejectSubmitting}
      />

      <LogsModal
        open={openLogModal}
        onClose={() => setOpenLogModal(false)}
        allLogs={subcontractorLogs?.logs}
        headerTitle={i18next.t('shortlisted-supplier-logs')}
        entity="Supplier"
        entity_no={subcontractorLogs?.entity_no}
        package_name={subcontractorLogs?.package_name}
      />

      <Popover
        data-testid="supplier-rejection-reason-popover"
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={() => handlePopoverClose()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, maxWidth: 280 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            {i18next.t('rejection-reason', {
              defaultValue: 'Rejection reason',
            })}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedReason || '-'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              data-testid="supplier-popover-acknowledge-btn"
              size="small"
              variant="outlined"
              onClick={handleAcknowledge}
              disabled={acknowledgeSubmitting}
            >
              {i18next.t('acknowledge', { defaultValue: 'Acknowledge' })}
            </Button>
          </Box>
        </Box>
      </Popover>

      <Menu
        data-testid="supplier-actions-menu"
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem data-testid="supplier-menu-view-logs" onClick={handleViewLogs}>{i18next.t('view-logs')}</MenuItem>
        {subcontractorListItem &&
          isPending(subcontractorListItem?.status) &&
          String(subcontractorListItem?.submitted_by?.id) ===
            String(clinkAccount?.user?.id) && (
            <MenuItem
              data-testid="supplier-menu-withdraw"
              onClick={() =>
                handleSubcontractorWithdrawal(subcontractorListItem)
              }
            >
              {i18next.t('withdraw')}
            </MenuItem>
          )}

        {/* Anything the bulk approval request would pick up (Draft or
            Rejection Acknowledged) can be pulled back out of it. */}
        {subcontractorListItem &&
          isSelectableForApproval(subcontractorListItem?.status) &&
          String(subcontractorListItem?.submitted_by?.id) ===
            String(clinkAccount?.user?.id) && (
            <MenuItem
              data-testid="supplier-menu-remove-from-shortlist"
              onClick={() => handleRemoveClick(subcontractorListItem)}
              sx={{ color: clinkRed, gap: 1 }}
            >
              <DeleteOutlinedIcon fontSize="small" />
              {i18next.t('remove-from-shortlist')}
            </MenuItem>
          )}
      </Menu>

      <Dialog
        data-testid="supplier-remove-dialog"
        open={removeDialogOpen}
        onClose={handleRemoveCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '8px' } }}
      >
        <DialogTitle
          sx={{ fontSize: 18, fontWeight: 700, color: japaneseIndigo, pb: 1 }}
        >
          {i18next.t('remove-from-shortlist-title')}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText sx={{ fontSize: 14, color: japaneseIndigo }}>
            {i18next.t('remove-from-shortlist-confirmation', {
              name: subcontractorListItem?.name || '',
            })}
          </DialogContentText>
          <Typography sx={{ fontSize: 13, color: gray2, mt: 1 }}>
            {i18next.t('remove-from-shortlist-detail')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            data-testid="supplier-remove-cancel-btn"
            variant="outlined"
            onClick={handleRemoveCancel}
            sx={{
              fontSize: 14,
              borderRadius: '6px',
              borderColor: christmasSilver,
              color: japaneseIndigo,
              textTransform: 'none',
            }}
          >
            {i18next.t('no-go-back')}
          </Button>
          <Button
            data-testid="supplier-remove-confirm-btn"
            onClick={handleRemoveConfirm}
            variant="contained"
            disabled={removing}
            startIcon={
              removing ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{
              fontSize: 14,
              borderRadius: '6px',
              px: 3,
              backgroundColor: clinkRed,
              '&:hover': {
                backgroundColor: clinkRed,
                opacity: 0.9,
              },
              textTransform: 'none',
            }}
          >
            {i18next.t('yes-remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ShortlistedSubcontractorsTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      status: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    }),
  ),
  projectId: PropTypes.number.isRequired,
  tenderId: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired,
  clinkAccount: PropTypes.object,
  bulkUpdateProjectHistory: PropTypes.func,
};

ShortlistedSubcontractorsTable.defaultProps = {
  data: [],
  bulkUpdateProjectHistory: null,
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(ShortlistedSubcontractorsTable);
