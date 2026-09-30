import React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SouthIcon from '@mui/icons-material/South';
import CheckCircle from '@mui/icons-material/CheckCircle';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import {
  STATUS_CONFIG,
  PanelRoot,
  LevelCard,
  LevelHeader,
  LevelHeaderLeft,
  LevelTitle,
  AllMustApproveChip,
  IndicatorBox,
  IndicatorLabel,
  LockedLabel,
  DividerRow,
  DividerText,
  StyledHeadCell,
  StyledBodyCell,
  ApproverRow,
  UserCellBox,
  UserAvatar,
  UserName,
  UserEmail,
  RoleText,
  TimestampText,
  BadgeBox,
  BadgePill,
  ApprovalStatus,
} from './index.styled';
import i18next from 'v2/helpers/i18n';
import { lightGreen, magnesium } from 'v2/constants/colors';
import CircularProgress from '@mui/material/CircularProgress';
import { useReminderHandler } from 'v2/apps/shared/hooks/useReminderHandler';

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} ${time}`;
}

function LevelIndicator({ approvers, levelStatus, level_number }) {
  if (levelStatus === 'locked') {
    return (
      <IndicatorBox data-testid={`approval-level-indicator-${level_number}`}>
        <LockOutlinedIcon sx={{ fontSize: 'small', color: magnesium }} />
        <LockedLabel>{i18next.t('locked')}</LockedLabel>
      </IndicatorBox>
    );
  }

  const approved = approvers.filter(
    (a) => a.status?.value === 'approved',
  ).length;
  const total = approvers.length;
  return (
    <IndicatorBox data-testid={`approval-level-indicator-${level_number}`}>
      <CheckCircle sx={{ fontSize: 'small', color: lightGreen }} />
      <IndicatorLabel>
        {approved}/{total} {i18next.t('approved')}
      </IndicatorLabel>
    </IndicatorBox>
  );
}

function StatusBadge({
  status,
  approverId,
  onSendReminder,
  isLevelInProgress,
  loadingReminderId,
  approverName,
  canSendReminder,
}) {
  const key = status?.value?.toLowerCase() ?? 'pending';
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.pending;
  const isPending = key === 'pending';

  return (
    <BadgeBox data-testid={`approver-status-${approverId}`}>
      <FiberManualRecordIcon sx={{ fontSize: 'small', color: cfg.dotColor }} />
      <BadgePill statusKey={key}>{status?.label ?? cfg.label}</BadgePill>

      {isPending && onSendReminder && canSendReminder && isLevelInProgress && (
        <Tooltip title={i18next.t('send-reminder')} placement="top">
          <IconButton
            data-testid={`send-reminder-btn-${approverId}`}
            size="small"
            disabled={loadingReminderId === approverId}
            onClick={() => onSendReminder(approverId, approverName)}
            sx={{
              ml: 0.5,
              p: 0.25,
              '&:hover': {
                backgroundColor: 'warning.lighter',
              },
            }}
          >
            {loadingReminderId === approverId ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <NotificationsNoneIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </BadgeBox>
  );
}

function LevelDivider({ fromLevel, toLevel }) {
  return (
    <DividerRow data-testid={`level-divider-${fromLevel}-${toLevel}`}>
      <SouthIcon sx={{ fontSize: 'small', color: magnesium }} />
      <DividerText>
        {i18next.t('level-sequence', { fromLevel, toLevel })}
      </DividerText>
      <SouthIcon sx={{ fontSize: 'small', color: magnesium }} />
    </DividerRow>
  );
}

function LevelPanel({
  level,
  onSendReminder,
  loadingReminderId,
  canSendReminder,
}) {
  const { level_number, rule, status, approvers = [], isLevel } = level;
  const isLocked = status === 'locked';
  const isLevelInProgress = ['in_progress', 'pending'].includes(
    status?.toLowerCase()
  );

  return (
    <LevelCard data-testid={`approval-level-${level_number}`}>
      {isLevel && (
        <LevelHeader isLocked={isLocked} data-testid={`approval-level-header-${level_number}`}>
          <LevelHeaderLeft>
            <LevelTitle isLocked={isLocked}>
              {i18next.t('level')} {level_number}
            </LevelTitle>
            <AllMustApproveChip label={rule} size="small" isLocked={isLocked} />
          </LevelHeaderLeft>
          <LevelIndicator approvers={approvers} levelStatus={status} level_number={level_number} />
        </LevelHeader>
      )}

      <TableContainer component={Paper} elevation={0}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <StyledHeadCell>{i18next.t('assigned-to')}</StyledHeadCell>
              <StyledHeadCell>{i18next.t('role')}</StyledHeadCell>
              <StyledHeadCell>{i18next.t('status')}</StyledHeadCell>
              <StyledHeadCell>{i18next.t('timestamp')}</StyledHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvers.map((approver) => {
              const {
                id,
                role_label,
                approver_user,
                status: aStatus,
                approval_requested_at,
                actioned_at,
                is_level_satisfied_by_higher_authority,
                is_level_satisfied_by_self_approved,
                is_satisfied_by_higher_authority,
                is_satisfied_by_self_approved,
              } = approver;
              const isRowLocked =
                isLocked || aStatus?.value?.toLowerCase() === 'locked';
              const displayStatus = isLocked
                ? { value: 'locked', label: i18next.t('locked') }
                : aStatus;
              const timestamp = actioned_at ?? approval_requested_at;

              const approvalMessageMap = [
                {
                  condition: is_level_satisfied_by_higher_authority,
                  message: i18next.t('approved-by-higher-authority'),
                },
                {
                  condition: is_level_satisfied_by_self_approved,
                  message: i18next.t('self-approved-by-requester'),
                },
                {
                  condition: is_satisfied_by_higher_authority,
                  message: i18next.t('approved-by-higher-authority'),
                },
                {
                  condition: is_satisfied_by_self_approved,
                  message: i18next.t('self-approved-by-requester'),
                },
              ];

              const approvalMessage =
                approvalMessageMap.find(({ condition }) => condition)
                  ?.message ?? null;

              return (
                <ApproverRow key={id} isLocked={isRowLocked} data-testid={`approver-row-${id}`}>
                  <StyledBodyCell>
                    <UserCellBox>
                      <UserAvatar isLocked={isRowLocked}>
                        {approver_user?.initials ?? '?'}
                      </UserAvatar>
                      <Box sx={{ minWidth: 0 }}>
                        <UserName isLocked={isRowLocked} noWrap>
                          {approver_user?.display_name ?? '—'}
                        </UserName>
                        <UserEmail noWrap>
                          {approver_user?.email ?? ''}
                        </UserEmail>
                        {approvalMessage && (
                          <ApprovalStatus>{approvalMessage}</ApprovalStatus>
                        )}
                      </Box>
                    </UserCellBox>
                  </StyledBodyCell>

                  <StyledBodyCell>
                    <RoleText isLocked={isRowLocked}>
                      {role_label ?? '—'}
                    </RoleText>
                  </StyledBodyCell>

                  <StyledBodyCell>
                    <StatusBadge
                      status={displayStatus}
                      approverId={id}
                      onSendReminder={onSendReminder}
                      loadingReminderId={loadingReminderId}
                      canSendReminder={canSendReminder}
                      isLevelInProgress={isLevelInProgress}
                      approverName={approver_user?.display_name ?? '—'}
                    />
                  </StyledBodyCell>

                  <StyledBodyCell>
                    <TimestampText>{formatTimestamp(timestamp)}</TimestampText>
                  </StyledBodyCell>
                </ApproverRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </LevelCard>
  );
}

const ApprovalExpandablePanel = ({
  levels = [],
  sendApprovalReminder,
  entity_id,
  entityIdKey = 'did',
  canSendReminder,
  onReminderSent,
}) => {
  const {
    handleSendReminder,
    loadingReminderId,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    closeSnackbar,
  } = useReminderHandler(sendApprovalReminder, entity_id, entityIdKey);
  if (!levels.length) {
    return (
      <Box
        data-testid="no-approval-levels"
        sx={{ py: 3, textAlign: 'center', color: magnesium, fontSize: 'small' }}
      >
        {i18next.t('no-approval-levels')}
      </Box>
    );
  }

  const handleReminderClick = async (approverId, approverName) => {
    const customMessage = i18next.t('order-approval-reminder-success', {
      approverName,
    });
    await handleSendReminder(approverId, approverName, customMessage);
    if (onReminderSent) {
      onReminderSent(approverId);
    }
  };

  return (
    <PanelRoot data-testid="approval-expandable-panel">
      {levels.map((level, idx) => {
        const nextLevel = levels[idx + 1];
        const showDivider = nextLevel && nextLevel.status === 'locked';

        return (
          <Box key={level.level_number}>
            <LevelPanel
              level={level}
              loadingReminderId={loadingReminderId}
              canSendReminder={canSendReminder}
              onSendReminder={handleReminderClick}
            />
            {showDivider && (
              <LevelDivider
                fromLevel={level.level_number}
                toLevel={nextLevel.level_number}
              />
            )}
          </Box>
        );
      })}

      {snackbarOpen && (
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={closeSnackbar}
        >
          <MuiAlert
            onClose={closeSnackbar}
            severity={snackbarSeverity}
            sx={{
              width: '100%',
              whiteSpace: 'pre-line',
              '& .MuiAlert-icon': { alignSelf: 'center' },
              '& .MuiAlert-action': { alignSelf: 'center' },
            }}
            elevation={6}
            variant="filled"
          >
            {snackbarMessage}
          </MuiAlert>
        </Snackbar>
      )}
    </PanelRoot>
  );
};

export default ApprovalExpandablePanel;
