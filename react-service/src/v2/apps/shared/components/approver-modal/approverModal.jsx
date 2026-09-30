import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import Alert from '@mui/material/Alert';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CONSTANTS } from 'clink-components';
import {
  white,
  christmasSilver,
  clinkGreen,
  clinkOrange,
  gray2,
} from 'v2/constants/colors';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import i18next from 'i18next';
import Grid2 from '@mui/material/Grid2';
import { APPROVAL_TYPES } from 'v2/constants/approval-types';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import { lightGray } from 'v2/constants/colors-prosper';
import TextField from '@mui/material/TextField';

const { ghostWhite } = CONSTANTS.colors.general;

const REQUIRED_APPROVERS_BY_RULE = {
  any: () => 1,
  custom: (level) =>
    level?.min_required > 0 ? level.min_required : (level?.roles || []).length,
};

const getRequiredApproversCount = (level) => {
  const roleCount = (level?.roles || []).length;
  const resolveRequiredCount = REQUIRED_APPROVERS_BY_RULE[level?.rule];

  return resolveRequiredCount ? resolveRequiredCount(level) : roleCount;
};

const SELECTION_GUIDANCE_BY_RULE = {
  any: {
    messageKey: 'select-approvers-alert-message-any',
    tagKey: 'select-approvers-tag-any',
  },
  all: {
    messageKey: 'select-approvers-alert-message-all',
    tagKey: 'select-approvers-tag-all',
  },
};

const CONDITION_GUIDANCE = {
  'self-approval-preselected': {
    messageKey: 'select-approvers-alert-message-self-approval-preselected',
    tagKey: 'select-approvers-tag-self-approval-preselected',
  },
  'higher-authority-preselected': {
    messageKey: 'select-approvers-alert-message-higher-authority-preselected',
    tagKey: 'select-approvers-tag-higher-authority-preselected',
  },
  'auto-approved-lower-level': {
    messageKey: 'select-approvers-alert-message-auto-approved-lower-level',
    tagKey: 'select-approvers-tag-auto-approved-lower-level',
  },
};

const getAuthorityMessaging = (level, isLevelAutoApproved) => {
  if (!isLevelAutoApproved) return null;

  const isHigherAuthoritySatisfied =
    level.is_level_satisfied_by_higher_authority ||
    (level.roles || []).some((role) => role.is_satisfied_by_higher_authority);

  if (isHigherAuthoritySatisfied) {
    return {
      progressText: i18next.t(
        'approver-progress-satisfied-by-higher-authority',
      ),
      guidance: { tagKey: 'approver-tag-recorded-higher-authority' },
    };
  }

  const isSelfApprovalSatisfied =
    level.is_level_satisfied_by_self_approved ||
    (level.roles || []).some((role) => role.is_satisfied_by_self_approved);

  if (isSelfApprovalSatisfied) {
    return {
      progressText: i18next.t('approver-progress-satisfied-by-authority'),
      guidance: { tagKey: 'approver-tag-recorded-self-approved' },
    };
  }

  return null;
};

const getSelectionGuidance = (level, appliedConditionId, authorityMessaging) =>
  authorityMessaging?.guidance ||
  CONDITION_GUIDANCE[appliedConditionId] ||
  SELECTION_GUIDANCE_BY_RULE[level?.rule] ||
  null;

const isSingleSelectionRule = (level) =>
  level?.rule === 'any' ||
  (level?.rule === 'custom' && level?.min_required === 1);

const isHigherAuthorityFallbackAllowed = (level, role) =>
  Boolean(
    role?.is_satisfied_by_higher_authority ||
    level?.is_level_satisfied_by_higher_authority,
  );

const isSelfApprovalSatisfiedForRole = (level, role) =>
  Boolean(
    role?.is_satisfied_by_self_approved ||
    level?.is_level_satisfied_by_self_approved,
  );

const getEligibleUsers = (level, role, currentUserId) => {
  const users = role?.users || [];
  if (
    isSelfApprovalSatisfiedForRole(level, role) ||
    isHigherAuthorityFallbackAllowed(level, role)
  ) {
    return users;
  }

  return users.filter((user) => String(user?.id) !== String(currentUserId));
};

const getRoleBlockReason = (level, role, currentUserId) => {
  const users = role?.users || [];
  if (users.length === 0) return 'no-users';

  const eligibleUsers = getEligibleUsers(level, role, currentUserId);
  if (eligibleUsers.length === 0) return 'self-blocked';

  return null;
};

const normalizeApproverLevels = (approverLevels, currentUserId) => {
  if (!Array.isArray(approverLevels)) return [];

  return approverLevels
    .map((level, levelIndex) => {
      const roles = (level?.roles || []).map((role) => {
        const users = (role?.users || []).map((user) => ({
          ...user,
          display_name: [user?.firstname, user?.lastname]
            .filter(Boolean)
            .join(' '),
        }));
        const normalizedRole = {
          id: role?.id,
          name: role?.label || role?.name,
          is_satisfied_by_self_approved: role?.is_satisfied_by_self_approved,
          is_satisfied_by_higher_authority:
            role?.is_satisfied_by_higher_authority,
          is_higher_condition_role: role?.is_higher_condition_role,
          users,
        };

        return {
          ...normalizedRole,
          blockReason: getRoleBlockReason(level, normalizedRole, currentUserId),
          eligibleUsers: getEligibleUsers(level, normalizedRole, currentUserId),
        };
      });

      const fallbackRole = roles.find(
        (role) =>
          role.is_higher_condition_role && role.eligibleUsers.length > 0,
      );

      const ordinaryRoles = roles.filter((role) => role !== fallbackRole);
      const blockedRoles = ordinaryRoles.filter((role) => role.blockReason);
      const requiredApprovers = getRequiredApproversCount(level);
      const nonBlockedRolesCount = ordinaryRoles.length - blockedRoles.length;
      const emptyBlockedRoles = blockedRoles.filter(
        (role) => role.blockReason === 'no-users',
      );
      const achievableWithFallback =
        nonBlockedRolesCount + (fallbackRole ? 1 : 0);
      const canFallbackCoverQuota =
        emptyBlockedRoles.length === 0 ||
        achievableWithFallback >= requiredApprovers;

      let status = 'ok';
      if (fallbackRole && blockedRoles.length > 0 && canFallbackCoverQuota) {
        status = 'fallback';
      } else if (
        blockedRoles.length > 0 &&
        (nonBlockedRolesCount < requiredApprovers || !canFallbackCoverQuota)
      ) {
        status = 'blocked';
      }

      return {
        level: level?.level ?? levelIndex + 1,
        approval_level_id: level?.approval_level_id,
        rule: level?.rule,
        rule_description: level?.rule_description,
        min_required: level?.min_required,
        is_level_satisfied_by_self_approved:
          level?.is_level_satisfied_by_self_approved,
        is_level_satisfied_by_higher_authority:
          level?.is_level_satisfied_by_higher_authority,
        requiredApprovers,
        isSingleSelectionRule: isSingleSelectionRule(level),
        roles,
        fallbackRole,
        blockedRoles,
        status,
      };
    })
    .filter((level) => level.roles.length > 0);
};

const getRoleKey = (level, role) => `${level?.level}-${role?.id}`;

const getInitialExpandedLevels = (levels, autoApprovedLevels) => {
  const levelToExpand = levels.find(
    (level) => !autoApprovedLevels.has(level.level),
  );

  return levels.reduce((accumulator, level) => {
    accumulator[level.level] = level === levelToExpand;
    return accumulator;
  }, {});
};

const getUserInitials = (user) => {
  const displayName = user?.display_name || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'NA';
};

const getSelectedCountForLevel = (level, selectedApproversByRole) =>
  level.roles.reduce((count, role) => {
    const selectedUserId = selectedApproversByRole[getRoleKey(level, role)];
    return selectedUserId ? count + 1 : count;
  }, 0);

const getUserBlockKey = (roleKey, userId) => `${roleKey}:${String(userId)}`;

const APPROVAL_CONDITIONS = [
  {
    id: 'higher-authority-preselected',
    action: 'preselect',
    matches: (level, role) =>
      Boolean(
        role.is_satisfied_by_higher_authority ||
        level.is_level_satisfied_by_higher_authority,
      ),
  },
  {
    id: 'self-approval-blocked',
    action: 'block',
    matches: (level, role, isSelfApprovalAllowed) =>
      isSelfApprovalAllowed === false,
  },
  {
    id: 'self-approval-preselected',
    action: 'preselect',
    matches: (level, role, isSelfApprovalAllowed) =>
      isSelfApprovalAllowed === true &&
      Boolean(
        role.is_satisfied_by_self_approved ||
        level.is_level_satisfied_by_self_approved,
      ),
  },
];

const PRESELECTION_SCOPE_BY_RULE = {
  any: { capByMinRequired: true },
  all: { capByMinRequired: false },
  custom: { capByMinRequired: true },
};

const findMatchingCondition = (
  isSelfApprovalAllowed,
  level,
  role,
  currentUserId,
) => {
  if (!currentUserId) return null;
  const isCurrentUserInRole = role.users.some(
    (user) => String(user.id) === String(currentUserId),
  );
  if (!isCurrentUserInRole) return null;

  return (
    APPROVAL_CONDITIONS.find((condition) =>
      condition.matches(level, role, isSelfApprovalAllowed),
    ) || null
  );
};

const CONDITION_PRIORITY_BY_ID = APPROVAL_CONDITIONS.reduce(
  (priorityById, condition, index) => {
    priorityById[condition.id] = index;
    return priorityById;
  },
  {},
);

const preferHigherPriorityCondition = (
  currentConditionId,
  candidateConditionId,
) => {
  if (!currentConditionId) return candidateConditionId;
  if (!candidateConditionId) return currentConditionId;

  return CONDITION_PRIORITY_BY_ID[candidateConditionId] <
    CONDITION_PRIORITY_BY_ID[currentConditionId]
    ? candidateConditionId
    : currentConditionId;
};

const computeLevelPreselection = (
  isSelfApprovalAllowed,
  isAutoCompleteLowerApprovalsEnabled,
  level,
  currentUserId,
) => {
  const scope =
    PRESELECTION_SCOPE_BY_RULE[level.rule] || PRESELECTION_SCOPE_BY_RULE.all;
  const selections = {};
  const disabledUserKeys = new Set();
  const preselectedRoleKeys = new Set();
  let appliedConditionId = null;
  let preselectedCount = 0;

  level.roles?.forEach((role) => {
    const condition = findMatchingCondition(
      isSelfApprovalAllowed,
      level,
      role,
      currentUserId,
    );
    if (!condition) return;

    appliedConditionId = preferHigherPriorityCondition(
      appliedConditionId,
      condition.id,
    );

    const roleKey = getRoleKey(level, role);

    if (condition.action === 'block') {
      disabledUserKeys.add(getUserBlockKey(roleKey, currentUserId));
      return;
    }

    if (scope.capByMinRequired && preselectedCount >= level.requiredApprovers) {
      return;
    }

    selections[roleKey] = currentUserId;
    preselectedRoleKeys.add(roleKey);
    preselectedCount += 1;
  });

  const isLevelBypassedWithoutSelection =
    preselectedCount === 0 &&
    Boolean(
      (isSelfApprovalAllowed && level.is_level_satisfied_by_self_approved) ||
      level.is_level_satisfied_by_higher_authority,
    );

  const isSatisfiedByAutoCompleteCascade = Boolean(
    isAutoCompleteLowerApprovalsEnabled &&
    level.is_level_satisfied_by_higher_authority,
  );

  if (isLevelBypassedWithoutSelection || isSatisfiedByAutoCompleteCascade) {
    appliedConditionId = appliedConditionId || 'auto-approved-lower-level';
  }

  const isLevelAutoApproved =
    isLevelBypassedWithoutSelection ||
    isSatisfiedByAutoCompleteCascade ||
    (preselectedCount > 0 && preselectedCount >= level.requiredApprovers);

  return {
    selections,
    disabledUserKeys,
    preselectedRoleKeys,
    appliedConditionId,
    isLevelAutoApproved,
  };
};

const computeApproverPreselections = (
  isSelfApprovalAllowed,
  isAutoCompleteLowerApprovalsEnabled,
  approverLevels,
  currentUserId,
) =>
  approverLevels?.reduce(
    (accumulator, level) => {
      const levelResult = computeLevelPreselection(
        isSelfApprovalAllowed,
        isAutoCompleteLowerApprovalsEnabled,
        level,
        currentUserId,
      );

      levelResult.disabledUserKeys.forEach((key) =>
        accumulator.disabledUserKeys.add(key),
      );
      levelResult.preselectedRoleKeys.forEach((key) =>
        accumulator.preselectedRoleKeys.add(key),
      );

      if (levelResult.appliedConditionId) {
        accumulator.levelConditions[level.level] =
          levelResult.appliedConditionId;
      }

      if (levelResult.isLevelAutoApproved) {
        accumulator.autoApprovedLevels.add(level.level);
      }

      Object.assign(accumulator.selections, levelResult.selections);

      return accumulator;
    },
    {
      selections: {},
      disabledUserKeys: new Set(),
      preselectedRoleKeys: new Set(),
      levelConditions: {},
      autoApprovedLevels: new Set(),
    },
  );

const EMPTY_AUTO_APPROVER_STATE = {
  disabledUserKeys: new Set(),
  preselectedRoleKeys: new Set(),
  levelConditions: {},
  autoApprovedLevels: new Set(),
};

const ApproverModal = ({
  id,
  open,
  onClose,
  onSubmit,
  approversPayload,
  fetchingApprovers,
  clinkAccount,
  dispatch,
  approvalType,
  meta,
}) => {
  const {
    allow_requester_self_approval: isSelfApprovalAllowed,
    auto_complete_lower_approvals: isAutoCompleteLowerApprovalsEnabled,
    levels: approvers,
  } = approversPayload;
  const context = useContext('clink');
  const { actions } = context;
  const { showSnackbar } = useSnackbar();
  const [selectedApproversByRole, setSelectedApproversByRole] = useState({});
  const [expandedLevels, setExpandedLevels] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [autoApproverState, setAutoApproverState] = useState(
    EMPTY_AUTO_APPROVER_STATE,
  );
  const currentUserId = clinkAccount?.user?.id;
  const accountId = clinkAccount?.id || context?.account?.id;
  const [varianceExplanation, setVarianceExplanation] = useState('');
  const hasOrderValueVariance =
    approvalType === 'order' &&
    meta?.has_tender_recommendation &&
    Number(meta?.values?.order_value) &&
    Number(meta?.quote?.forecast) &&
    Number(meta.values.order_value) !== Number(meta.quote.forecast);
  const approverLevels = useMemo(
    () => normalizeApproverLevels(approvers, currentUserId),
    [approvers, currentUserId],
  );

  const totalRequiredRoles = useMemo(
    () =>
      approverLevels.reduce(
        (count, level) => count + level.requiredApprovers,
        0,
      ),
    [approverLevels],
  );

  const approvalTypeLabel = {
    [APPROVAL_TYPES.ORDER]: 'Order',
    [APPROVAL_TYPES.TENDER_RECOMMENDATION]: 'Tender Recommendations',
    [APPROVAL_TYPES.SUPPLIER_LIST]: 'Supplier',
    [APPROVAL_TYPES.TENDER_ENQUIRY]: 'Tender Enquiry',
  }[approvalType];

  const nonAutoApprovedLevels = useMemo(
    () =>
      approverLevels.filter(
        (level) => !autoApproverState.autoApprovedLevels.has(level.level),
      ),
    [approverLevels, autoApproverState.autoApprovedLevels],
  );

  const hasBlockedLevel = useMemo(
    () => nonAutoApprovedLevels.some((level) => level.status === 'blocked'),
    [nonAutoApprovedLevels],
  );

  const areAllLevelsPreSatisfied = useMemo(
    () =>
      approverLevels.length > 0 &&
      approverLevels.every((level) =>
        autoApproverState.autoApprovedLevels.has(level.level),
      ),
    [approverLevels, autoApproverState.autoApprovedLevels],
  );

  const fallbackOrBlockedLevel = useMemo(
    () =>
      nonAutoApprovedLevels.find((level) => level.status === 'blocked') ||
      nonAutoApprovedLevels.find((level) => level.status === 'fallback'),
    [nonAutoApprovedLevels],
  );

  const fallbackOrBlockedRole = fallbackOrBlockedLevel?.blockedRoles?.[0];

  let fallbackOrBlockedMessageKey = 'no-eligible-approver-message';

  if (fallbackOrBlockedRole?.blockReason === 'self-blocked') {
    fallbackOrBlockedMessageKey = 'self-approval-disabled-no-other-approver';
  } else if (fallbackOrBlockedLevel?.status === 'fallback') {
    fallbackOrBlockedMessageKey = 'higher-authority-fallback-available-message';
  }

  const hasMetAllLevelRequirements = useMemo(
    () =>
      approverLevels?.every(
        (level) =>
          autoApproverState.autoApprovedLevels.has(level.level) ||
          getSelectedCountForLevel(level, selectedApproversByRole) >=
            level.requiredApprovers,
      ),
    [
      approverLevels,
      selectedApproversByRole,
      autoApproverState.autoApprovedLevels,
    ],
  );

  useEffect(() => {
    if (!open) {
      setSelectedApproversByRole({});
      setExpandedLevels({});
      setSubmitting(false);
      setFetchError(false);
      setAutoApproverState(EMPTY_AUTO_APPROVER_STATE);
      setVarianceExplanation('');
      if (!['order', 'tender_enquiry'].includes(approvalType)) {
        dispatch(actions?.resetApprovers?.());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || approverLevels.length === 0) return;

    setAutoApproverState((currentAutoApproverState) => {
      if (currentAutoApproverState !== EMPTY_AUTO_APPROVER_STATE) {
        return currentAutoApproverState;
      }

      const preselection = computeApproverPreselections(
        isSelfApprovalAllowed,
        isAutoCompleteLowerApprovalsEnabled,
        approverLevels,
        currentUserId,
      );

      setSelectedApproversByRole((currentSelections) => ({
        ...preselection.selections,
        ...currentSelections,
      }));

      setExpandedLevels((currentExpandedLevels) =>
        Object.keys(currentExpandedLevels).length > 0
          ? currentExpandedLevels
          : getInitialExpandedLevels(
              approverLevels,
              preselection.autoApprovedLevels,
            ),
      );

      return {
        disabledUserKeys: preselection.disabledUserKeys,
        preselectedRoleKeys: preselection.preselectedRoleKeys,
        levelConditions: preselection.levelConditions,
        autoApprovedLevels: preselection.autoApprovedLevels,
      };
    });
  }, [
    open,
    approverLevels,
    isSelfApprovalAllowed,
    isAutoCompleteLowerApprovalsEnabled,
    currentUserId,
  ]);

  useEffect(() => {
    if (open && accountId && approvalType) {
      setFetchError(false);
      if (approvalType === 'order' || approvalType === 'tender_enquiry') return;

      const isSupplierList = approvalType === 'supplier_list';

      const action = isSupplierList
        ? actions.fetchApproversShortlistedSubs({
            account_id: accountId,
            approval_type: approvalType,
            pid: id,
          })
        : actions.fetchApproversWithLevels({
            account_id: accountId,
            approval_type: approvalType,
            id,
          });

      const request = dispatch(action).unwrap();

      if (isSupplierList) {
        request.catch(() => setFetchError(true));
      }
    }
  }, [open, dispatch, accountId, actions, id, approvalType]);

  const handleClose = () => {
    setSelectedApproversByRole({});
    onClose();
  };

  const handleSubmit = async () => {
    const selectedApprovers = [];

    approverLevels.forEach((level) => {
      let hasSelectionForLevel = false;

      level.roles.forEach((role) => {
        const userId = selectedApproversByRole[getRoleKey(level, role)];
        if (userId) {
          hasSelectionForLevel = true;
          selectedApprovers.push({
            user_id: userId,
            approval_level_id: level?.approval_level_id,
            is_level_satisfied_by_self_approved:
              level?.is_level_satisfied_by_self_approved,
            is_level_satisfied_by_higher_authority:
              level?.is_level_satisfied_by_higher_authority,
            is_satisfied_by_self_approved: role?.is_satisfied_by_self_approved,
            is_satisfied_by_higher_authority:
              role?.is_satisfied_by_higher_authority,
          });
        }
      });

      if (
        !hasSelectionForLevel &&
        level?.is_level_satisfied_by_higher_authority
      ) {
        selectedApprovers.push({
          user_id: currentUserId,
          approval_level_id: level?.approval_level_id,
          is_level_satisfied_by_self_approved:
            level?.is_level_satisfied_by_self_approved,
          is_level_satisfied_by_higher_authority:
            level?.is_level_satisfied_by_higher_authority,
          is_satisfied_by_self_approved: false,
          is_satisfied_by_higher_authority: false,
        });
      }
    });

    setSubmitting(true);

    try {
      await onSubmit({
        selectedApprovers,
        ...(hasOrderValueVariance && {
          varianceExplanation: varianceExplanation.trim(),
        }),
      });

      showSnackbar(i18next.t('approval-request-submitted-success'), 'success');
      onClose();
    } catch (error) {
      const errorMessage =
        error?.message || i18next.t('approval-request-failed');
      showSnackbar(errorMessage, 'error');
      setSubmitting(false);
    }
  };

  const handleApproverSelect = (level, role, userId) => {
    const roleKey = getRoleKey(level, role);

    if (
      autoApproverState.disabledUserKeys.has(getUserBlockKey(roleKey, userId))
    ) {
      return;
    }

    setSelectedApproversByRole((currentSelections) => {
      if (!level.isSingleSelectionRule) {
        return { ...currentSelections, [roleKey]: userId };
      }

      const updatedSelections = { ...currentSelections };
      const isCurrentRoleAlreadySelected = Boolean(updatedSelections[roleKey]);
      const selectedCount = getSelectedCountForLevel(level, updatedSelections);

      if (
        !isCurrentRoleAlreadySelected &&
        selectedCount >= level.requiredApprovers
      ) {
        const otherRoleKeys = level.roles
          .filter((otherRole) => otherRole.id !== role.id)
          .map((otherRole) => getRoleKey(level, otherRole));

        let excessCount = selectedCount - level.requiredApprovers + 1;
        otherRoleKeys.some((otherRoleKey) => {
          if (excessCount <= 0) return true;
          if (updatedSelections[otherRoleKey]) {
            delete updatedSelections[otherRoleKey];
            excessCount -= 1;
          }
          return false;
        });
      }

      updatedSelections[roleKey] = userId;
      return updatedSelections;
    });
  };

  const resetLevelSelections = (level, currentSelections) => {
    const updatedSelections = { ...currentSelections };
    level.roles.forEach((role) => {
      delete updatedSelections[getRoleKey(level, role)];
    });
    return updatedSelections;
  };

  const handleLevelReset = (level) => (event) => {
    event.stopPropagation();
    setSelectedApproversByRole((currentSelections) =>
      resetLevelSelections(level, currentSelections),
    );
  };

  const handleLevelToggle = (levelNumber) => (_, isExpanded) => {
    setExpandedLevels((currentExpandedLevels) => ({
      ...currentExpandedLevels,
      [levelNumber]: isExpanded,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="approver-modal"
      PaperProps={{
        sx: {
          borderRadius: '14px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2.5 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.5 }}
            >
              <PeopleOutlineIcon sx={{ color: clinkGreen, fontSize: 24 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {i18next.t('select-approvers')}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{ color: gray2, maxWidth: 470, lineHeight: 1.6 }}
            >
              {i18next.t('select-approvers-description')}
            </Typography>
            {approvalType === APPROVAL_TYPES.SUPPLIER_LIST &&
              !fallbackOrBlockedLevel && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  <Grid2 container sx={{ alignItems: 'center' }}>
                    <Typography>
                      {i18next.t('select-approvers-alert-message')}
                    </Typography>
                  </Grid2>
                </Alert>
              )}
            {fallbackOrBlockedLevel && (
              <Alert
                severity={
                  fallbackOrBlockedLevel.status === 'fallback'
                    ? 'warning'
                    : 'error'
                }
                sx={{ mt: 1.5 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {i18next.t(
                    fallbackOrBlockedLevel.status === 'fallback'
                      ? 'higher-authority-fallback-available-title'
                      : 'no-eligible-approver-title',
                  )}
                </Typography>

                <Typography variant="body2">
                  {i18next.t(fallbackOrBlockedMessageKey, {
                    role: fallbackOrBlockedRole?.name,
                    approvalType: approvalTypeLabel,
                  })}
                </Typography>

                {fallbackOrBlockedLevel.status === 'blocked' && (
                  <Chip
                    icon={<InfoOutlinedIcon />}
                    label={i18next.t('remains-editable-tag', {
                      approvalType: approvalTypeLabel,
                    })}
                    size="small"
                    sx={{
                      mt: 1,
                      color: '#fff',
                      backgroundColor: clinkGreen,
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: '#fff',
                      },
                    }}
                  />
                )}
              </Alert>
            )}
          </Box>
          <IconButton
            data-testid="approver-modal-close"
            onClick={handleClose}
            size="small"
            sx={{ mt: -0.5, mr: -1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {fetchingApprovers && (
          <Box
            data-testid="approver-modal-loading"
            sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {!fetchingApprovers && approverLevels.length === 0 && (
          <Box
            data-testid="approver-modal-empty"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              gap: 1.5,
            }}
          >
            <PeopleOutlineIcon sx={{ fontSize: 40, color: gray2 }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: gray2 }}
            >
              {i18next.t('no-approvers-available')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: gray2, textAlign: 'center', maxWidth: 320 }}
            >
              {i18next.t('no-users-assigned-for-level')}
            </Typography>
          </Box>
        )}

        {!fetchingApprovers && approverLevels.length > 0 && (
          <Stack spacing={1.5}>
            {approverLevels.map((level) => {
              const selectedCount = getSelectedCountForLevel(
                level,
                selectedApproversByRole,
              );
              const isLevelAutoApproved =
                autoApproverState.autoApprovedLevels.has(level.level);
              const appliedConditionId =
                autoApproverState.levelConditions[level.level];
              const authorityMessaging = getAuthorityMessaging(
                level,
                isLevelAutoApproved,
              );
              const selectionGuidance = getSelectionGuidance(
                level,
                appliedConditionId,
                authorityMessaging,
              );
              let levelProgressText = `${selectedCount}/${level.requiredApprovers} selected`;
              if (authorityMessaging) {
                levelProgressText = authorityMessaging.progressText;
              } else if (isLevelAutoApproved) {
                levelProgressText = i18next.t('approver-level-auto-approved');
              }

              return (
                <Accordion
                  key={level.level}
                  data-testid={`approver-modal-level-${level.level}`}
                  expanded={Boolean(expandedLevels[level.level])}
                  onChange={
                    isLevelAutoApproved
                      ? () => {}
                      : handleLevelToggle(level.level)
                  }
                  disableGutters
                  sx={{
                    border: `1px solid ${christmasSilver}`,
                    borderRadius: '8px',
                  }}
                >
                  <AccordionSummary
                    data-testid={`approver-modal-level-summary-${level.level}`}
                    expandIcon={!isLevelAutoApproved && <ExpandMoreIcon />}
                    sx={{
                      px: 2,
                      py: 0.5,
                      backgroundColor: ghostWhite,
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2,
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {i18next.t('level-number', {
                          number: level.level,
                        })}
                      </Typography>
                      <Chip label={level.rule_description} size="small" />
                    </Stack>
                    <Stack direction="row" alignItems="center">
                      {level.rule === 'custom' && !isLevelAutoApproved && (
                        <Typography
                          variant="body2"
                          onClick={handleLevelReset(level)}
                          sx={{
                            color: clinkGreen,
                            textDecoration: 'underline',
                            fontWeight: 500,
                            cursor: 'pointer',
                            pr: 1,
                          }}
                        >
                          {i18next.t('clear-level')}
                        </Typography>
                      )}
                      {authorityMessaging ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          sx={{ pr: 1 }}
                        >
                          <CheckCircleIcon
                            sx={{ fontSize: 16, color: clinkGreen }}
                          />
                          <Typography
                            id="selectionCount"
                            variant="body2"
                            sx={{ color: clinkGreen, fontWeight: 600 }}
                          >
                            {levelProgressText}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography
                          id="selectionCount"
                          variant="body2"
                          sx={{ color: gray2, pr: 1 }}
                        >
                          {levelProgressText}
                        </Typography>
                      )}
                    </Stack>
                    {selectionGuidance && (
                      <Stack
                        spacing={1}
                        sx={{
                          flexBasis: '100%',

                          pb: 0.5,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Chip
                          id="tagKey"
                          icon={<InfoOutlinedIcon sx={{ color: white }} />}
                          label={i18next.t(selectionGuidance.tagKey)}
                          size="small"
                          sx={{
                            color: white,
                            backgroundColor: `${clinkGreen}`,
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: white },
                          }}
                        />
                      </Stack>
                    )}
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0 }}>
                    <Box sx={{ maxHeight: 385, overflowY: 'auto' }}>
                      {selectionGuidance && (
                        <Stack
                          spacing={1}
                          sx={{
                            px: 2.5,
                            pt: 2,
                            pb: 0.5,
                            alignItems: 'flex-start',
                          }}
                        >
                          {selectionGuidance.messageKey && (
                            <Typography variant="body2" sx={{ color: gray2 }}>
                              {i18next.t(selectionGuidance.messageKey)}
                            </Typography>
                          )}
                        </Stack>
                      )}
                      {level.roles.map((role, roleIndex) => {
                        const roleKey = getRoleKey(level, role);
                        const selectedUserId = selectedApproversByRole[roleKey];
                        const isRoleLocked =
                          !level.isSingleSelectionRule &&
                          !selectedUserId &&
                          selectedCount >= level.requiredApprovers;

                        return (
                          <Accordion
                            key={roleKey}
                            data-testid={`approver-modal-role-${roleKey}`}
                            defaultExpanded
                            disableGutters
                            square
                            sx={{
                              cursor: isRoleLocked ? 'not-allowed' : 'auto',
                              boxShadow: 'none',
                              backgroundColor: 'transparent',
                              borderBottom:
                                roleIndex < level.roles.length - 1
                                  ? `1px solid ${christmasSilver}`
                                  : 'none',
                              '&:before': { display: 'none' },
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                px: 2.5,
                                opacity: isRoleLocked ? 0.5 : 1,
                                flexDirection: 'row-reverse',
                                '& .MuiAccordionSummary-content': {
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                },
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600 }}
                              >
                                {role.name}{' '}
                                {role?.is_higher_condition_role &&
                                  '(Higher Authority)'}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: gray2,
                                  backgroundColor: lightGray,
                                  borderRadius: '16px',
                                  px: 1,
                                  py: 0.25,
                                }}
                              >
                                {i18next.t('users-count', {
                                  count: role.users.length,
                                })}
                              </Typography>
                            </AccordionSummary>

                            <AccordionDetails sx={{ pt: 0 }}>
                              <Stack spacing={1.25} sx={{ px: 2.5, pb: 2.25 }}>
                                {level.status === 'fallback' &&
                                  role === level.fallbackRole && (
                                    <Chip
                                      icon={
                                        <InfoOutlinedIcon
                                          sx={{ color: white }}
                                        />
                                      }
                                      label={i18next.t(
                                        'higher-authority-fallback-enabled-tag',
                                      )}
                                      size="small"
                                      sx={{
                                        alignSelf: 'flex-start',
                                        color: white,
                                        backgroundColor: clinkGreen,
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { color: white },
                                      }}
                                    />
                                  )}
                                {role.users.length === 0 && (
                                  <Alert
                                    data-testid={`approver-modal-no-users-${roleKey}`}
                                    severity="warning"
                                    sx={{ borderRadius: '6px' }}
                                  >
                                    {i18next.t('no-users-assigned-for-level')}
                                  </Alert>
                                )}
                                {role.blockReason === 'no-users' &&
                                  (level.status === 'fallback' ? (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 1.5,
                                        py: 1.25,
                                        borderRadius: '8px',
                                        border: `1px dashed ${christmasSilver}`,
                                        backgroundColor: ghostWhite,
                                        color: gray2,
                                      }}
                                    >
                                      <PeopleOutlineIcon fontSize="small" />
                                      <Typography variant="body2">
                                        {i18next.t(
                                          'no-project-members-assigned-for-role',
                                          { role: role.name },
                                        )}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 1.5,
                                        py: 1.25,
                                        borderRadius: '8px',
                                        border: `1px dashed ${christmasSilver}`,
                                        backgroundColor: ghostWhite,
                                        color: gray2,
                                      }}
                                    >
                                      <PersonOffOutlinedIcon fontSize="small" />
                                      <Typography
                                        variant="body2"
                                        sx={{ fontStyle: 'italic' }}
                                      >
                                        {i18next.t(
                                          'no-users-assigned-to-role-on-project',
                                        )}
                                      </Typography>
                                    </Box>
                                  ))}
                                {(!role.blockReason ||
                                  role.blockReason === 'self-blocked') &&
                                  role.users.map((user) => {
                                    const isSelected =
                                      String(selectedUserId) ===
                                      String(user?.id);
                                    const isBlocked =
                                      autoApproverState.disabledUserKeys.has(
                                        getUserBlockKey(roleKey, user?.id),
                                      ) || role.blockReason === 'self-blocked';
                                    const isOtherUserInPreselectedRole =
                                      !isSelected &&
                                      autoApproverState.preselectedRoleKeys.has(
                                        roleKey,
                                      );
                                    const isDisabled =
                                      isRoleLocked ||
                                      isBlocked ||
                                      isOtherUserInPreselectedRole;

                                    return (
                                      <Paper
                                        key={user?.id}
                                        variant="outlined"
                                        data-testid={`approver-modal-user-${user?.id}`}
                                        onClick={() =>
                                          !isDisabled &&
                                          handleApproverSelect(
                                            level,
                                            role,
                                            user?.id,
                                          )
                                        }
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1.5,
                                          px: 1.5,
                                          py: 1.25,
                                          borderRadius: '8px',
                                          borderColor: isSelected
                                            ? clinkGreen
                                            : christmasSilver,
                                          backgroundColor: isSelected
                                            ? clinkGreen + '1A'
                                            : white,
                                          opacity: isDisabled ? 0.6 : 1,
                                          cursor: isDisabled
                                            ? 'default'
                                            : 'pointer',
                                        }}
                                      >
                                        <Radio
                                          data-testid={`approver-modal-radio-${user?.id}`}
                                          checked={isSelected}
                                          value={user?.id}
                                          disabled={isDisabled}
                                          onChange={() =>
                                            handleApproverSelect(
                                              level,
                                              role,
                                              user?.id,
                                            )
                                          }
                                          sx={{ p: 0.5 }}
                                        />
                                        <Avatar sx={{ bgcolor: clinkGreen }}>
                                          {getUserInitials(user)}
                                        </Avatar>
                                        <Box>
                                          <Typography
                                            variant="body1"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {user?.display_name}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ color: gray2 }}
                                          >
                                            {user?.email}
                                          </Typography>
                                          {isBlocked && (
                                            <Chip
                                              id="userTag"
                                              label={i18next.t(
                                                'approver-self-approval-blocked-note',
                                              )}
                                              size="small"
                                              sx={{
                                                mt: 0.5,
                                                height: 20,
                                                color: white,
                                                backgroundColor: `${clinkGreen}`,
                                                fontWeight: 600,
                                              }}
                                            />
                                          )}
                                        </Box>
                                      </Paper>
                                    );
                                  })}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}

        {hasOrderValueVariance && (
          <TextField
            fullWidth
            multiline
            minRows={3}
            required
            label="The order value differs from the tender recommendation. Please explain the reason for this variance."
            value={varianceExplanation}
            onChange={(event) => setVarianceExplanation(event.target.value)}
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: `1px solid ${christmasSilver}`,
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1.5,
        }}
      >
        {hasBlockedLevel && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            data-testid="approver-modal-empty-role-warning"
          >
            <WarningAmberIcon sx={{ color: clinkOrange, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: clinkOrange }}>
              {i18next.t('no-approval-request-without-users')}
            </Typography>
          </Stack>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            data-testid="approver-modal-cancel"
            onClick={handleClose}
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            {i18next.t('cancel')}
          </Button>
          <Button
            data-testid="approver-modal-submit"
            variant="contained"
            onClick={handleSubmit}
            disabled={
              fetchError ||
              (hasBlockedLevel && !areAllLevelsPreSatisfied) ||
              !hasMetAllLevelRequirements ||
              totalRequiredRoles === 0 ||
              submitting ||
              (hasOrderValueVariance && !varianceExplanation.trim())
            }
            startIcon={
              submitting ? (
                <CircularProgress size={20} sx={{ color: white }} />
              ) : null
            }
            sx={{
              borderRadius: '4px',
              px: 2.5,
            }}
          >
            {i18next.t(
              areAllLevelsPreSatisfied
                ? 'apply-approval-and-submit-order'
                : 'request-approval',
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

ApproverModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  approversPayload: PropTypes.shape({
    allow_requester_self_approval: PropTypes.bool,
    auto_complete_lower_approvals: PropTypes.bool,
    levels: PropTypes.arrayOf(
      PropTypes.shape({
        level: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        rule: PropTypes.string,
        is_level_satisfied_by_self_approved: PropTypes.bool,
        is_level_satisfied_by_higher_authority: PropTypes.bool,
        roles: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            name: PropTypes.string,
            is_satisfied_by_self_approved: PropTypes.bool,
            is_satisfied_by_higher_authority: PropTypes.bool,
            is_higher_condition_role: PropTypes.bool,
            users: PropTypes.arrayOf(
              PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
                display_name: PropTypes.string,
                email: PropTypes.string,
              }),
            ),
          }),
        ),
      }),
    ),
  }),
  fetchingApprovers: PropTypes.bool,
  clinkAccount: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    user: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  }),
  dispatch: PropTypes.func.isRequired,
};

ApproverModal.defaultProps = {
  approversPayload: { levels: [] },
  fetchingApprovers: false,
};

const mapStateToProps = (state) => ({
  approversPayload: state.procurementSchedule.approvers,
  fetchingApprovers: state.procurementSchedule.fetchingApprovers,
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(ApproverModal);
