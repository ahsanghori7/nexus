import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import i18next from 'v2/helpers/i18n';
import { formatUKorAnzDateTime } from 'helpers/date';
import { clinkOrange, white } from 'v2/constants/colors';

const TrRejectionFeedbackBanner = ({
  tenderData,
  assignedApprovers,
  countryCode,
  onAcknowledge,
  acknowledging,
}) => {
  if (tenderData?.status !== 'Rejected') return null;

  const resolvedApprovers = assignedApprovers ?? [];
  const allApprovers = resolvedApprovers.flatMap(
    (levelObj) => levelObj?.approvers ?? [],
  );
  const rejectedApprover = allApprovers.find(
    (a) => a.status?.label === 'Rejected',
  );

  const comment = rejectedApprover?.comment ?? '—';
  const approverName = rejectedApprover?.approver_user?.display_name ?? '—';
  const approverRole = rejectedApprover?.approver_user?.account_role?.label;
  const rejectedAt = rejectedApprover?.updated_at ?? null;
  const formattedDate = rejectedAt
    ? `${formatUKorAnzDateTime(rejectedAt, countryCode).date}, ${formatUKorAnzDateTime(rejectedAt, countryCode).time}`
    : '—';

  return (
    <Box
      data-testid="tr-rejection-banner"
      mx={3}
      mb={2}
      sx={{
        backgroundColor: `${clinkOrange}1A`,
        border: `1px solid ${clinkOrange}`,
        borderRadius: 2,
        p: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <WarningAmberIcon sx={{ color: clinkOrange, fontSize: 20 }} />
        <Typography
          variant="subtitle2"
          sx={{ color: clinkOrange, fontWeight: 600 }}
        >
          {i18next.t('rejection-action-required-title')}
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: white,
          borderRadius: 1,
          border: `1px solid ${clinkOrange}`,
          p: 1.5,
          mb: 1.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{ mb: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {comment}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            {i18next.t('rejected-by-label')}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            {approverName}
          </Typography>
          {approverRole && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ({approverRole})
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {formattedDate}
          </Typography>
        </Box>
      </Box>

      <Button
        data-testid="tr-rejection-acknowledge-btn"
        variant="outlined"
        size="small"
        startIcon={
          acknowledging ? (
            <CircularProgress size={14} sx={{ color: clinkOrange }} />
          ) : (
            <TaskAltIcon />
          )
        }
        onClick={onAcknowledge}
        disabled={acknowledging}
        sx={{
          color: clinkOrange,
          borderColor: clinkOrange,
          textTransform: 'none',
          '&:hover': {
            borderColor: clinkOrange,
            backgroundColor: `${clinkOrange}1A`,
          },
        }}
      >
        {i18next.t('acknowledge')}
      </Button>
    </Box>
  );
};

export default TrRejectionFeedbackBanner;
