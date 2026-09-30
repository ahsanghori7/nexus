import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import i18next from 'v2/helpers/i18n';
import {
  clinkRed,
  clinkGreen,
  christmasSilver,
  grayDark,
  white,
} from 'v2/constants/colors';

const RejectedOrdersPanel = ({ rejectedOrders = [], onAcknowledge, docType }) => {
  const rejectedLabel =
    docType === 'tender'
      ? i18next.t('tender_rejected')
      : i18next.t('order_rejected');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' at');
  };

  return (
    <Box
      sx={{
        border: `1px solid ${christmasSilver}`,
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: white,
      }}
    >
      <Typography
        variant="subtitle2"
        p="10px 16px"
        sx={{ borderBottom: `1px solid ${christmasSilver}` }}
      >
        {i18next.t('rejection_feedback')}
      </Typography>

      {rejectedOrders.map((order) => (
        <Box
          key={order.id}
          p="14px 16px"
          sx={{
            borderBottom: `1px solid ${grayDark}`,
            '&:last-child': { borderBottom: 'none' },
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="6px"
          >
            <Box display="flex" alignItems="center" gap="6px">
              <WarningAmberIcon fontSize="small" sx={{ color: clinkRed }} />
              <Typography variant="subtitle2" sx={{ color: clinkRed }}>
                {rejectedLabel}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="small"
              onClick={() => onAcknowledge(order.id)}
              sx={{
                borderColor: clinkGreen,
                color: clinkGreen,
                textTransform: 'none',
                fontSize: '0.75rem',
                px: 1.75,
                py: 0.375,
                '&:hover': {
                  borderColor: clinkGreen,
                  backgroundColor: 'transparent',
                  opacity: 0.9,
                },
              }}
            >
              {i18next.t('acknowledge')}
            </Button>
          </Box>

          <Typography variant="body2" mb="6px">
            {order.reason || '—'}
          </Typography>

          <Typography variant="caption">
            {i18next.t('by')}: {order.approver?.name || '—'}
            {order.approver?.role && ` (${order.approver.role})`}{' '}
            {formatDate(order.rejectedAt)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default RejectedOrdersPanel;
