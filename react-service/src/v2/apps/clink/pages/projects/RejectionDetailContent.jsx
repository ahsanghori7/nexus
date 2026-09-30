import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import i18next from 'v2/helpers/i18n';
import { goToNewTab } from 'v2/helpers/url';
import { clinkLightGray, lightGray3, grayDark } from 'v2/constants/colors';

const EDIT_LABELS = {
  order: 'edit-order',
  tender_recommendation: 'edit-tender-recommendation',
};

const RejectionDetailContent = ({ rejection }) => {
  if (!rejection) return null;

  const buttonLabel = i18next.t(EDIT_LABELS[rejection.type]);

  const handleEditClick = () => {
    if (rejection.onEdit) {
      rejection.onEdit();
    } else {
      goToNewTab(rejection.editUrl);
    }
  };

  return (
    <>
      <Box px={2} pt={1.5} pb={1}>
        <Typography
          variant="caption"
          display="block"
          mb="4px"
          sx={{ letterSpacing: '0.5px' }}
        >
          {i18next.t('rejection_note')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            wordBreak: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {rejection.comment}
        </Typography>
      </Box>

      <Box mx={2} sx={{ borderTop: `1px solid ${grayDark}` }} />

      <Box px={2} pt={1} pb={1.5}>
        <Typography
          variant="caption"
          display="block"
          mb="4px"
          sx={{ letterSpacing: '0.5px' }}
        >
          {i18next.t('rejected_by')}
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {rejection.approverName}
          {rejection.approverRole && (
            <Typography component="span" variant="body2" color="text.secondary">
              {' '}
              ({rejection.approverRole})
            </Typography>
          )}
        </Typography>
      </Box>

      <Box px={2} py={1.5} sx={{ borderTop: `1px solid ${grayDark}` }}>
        <Typography variant="caption" display="block" sx={{ lineHeight: 1.5 }}>
          {i18next.t('rejection_resolve_hint', {
            type: i18next.t(rejection.type),
          })}
        </Typography>
      </Box>

      <Box px={2} py={1.5} sx={{ borderTop: `1px solid ${grayDark}` }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          sx={{
            textTransform: 'none',
            borderColor: clinkLightGray,
            '&:hover': {
              borderColor: clinkLightGray,
              backgroundColor: lightGray3,
            },
          }}
          onClick={handleEditClick}
        >
          {buttonLabel}
        </Button>
      </Box>
    </>
  );
};

export default RejectionDetailContent;
