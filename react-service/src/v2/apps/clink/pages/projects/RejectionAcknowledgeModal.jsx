import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import i18next from 'v2/helpers/i18n';
import { black, clinkRed, grayDark } from 'v2/constants/colors';

const RejectionAcknowledgeModal = ({
  anchorEl,
  onClose,
  children,
  showHeader = true,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  width,
}) => {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      PaperProps={{
        sx: {
          width,
          borderRadius: 2,
          p: 0,
          overflow: 'hidden',
          boxShadow: `0 4px 20px ${black}1A`,
        },
      }}
    >
      {showHeader && (
        <Box
          display="flex"
          alignItems="center"
          gap="8px"
          px={2}
          py={1.5}
          sx={{ borderBottom: `1px solid ${grayDark}` }}
        >
          <InfoOutlinedIcon fontSize="small" sx={{ color: clinkRed }} />
          <Typography variant="subtitle2" sx={{ color: clinkRed }}>
            {i18next.t('rejection_details')}
          </Typography>
        </Box>
      )}
      {children}
    </Popover>
  );
};

export default RejectionAcknowledgeModal;
