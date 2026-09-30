import React from 'react';
import upperFirst from 'lodash/upperFirst';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getStatus, getDaysToShow } from 'v2/helpers/status/enquiries';

const ActionButtonContent = ({
  data,
  handleAction,
  redVersion = true,
  label = null,
  hideWaitTime = false,
}) => {
  const { t } = useTranslation();
  const status = getStatus(data);
  const daysToShow = getDaysToShow(data);
  const enabled = status.enableAction ?? false;
  const countText =
    daysToShow && Number(daysToShow) > 1 ? 'text-in-days' : 'text-in-day';
  const waitText = daysToShow ? t(countText, { count: daysToShow }) : '';
  const text = label ?? t(status.waiting);

  return (
    <Button
      data-testid="action-button"
      disabled={!enabled}
      variant="contained"
      color={redVersion ? 'error' : 'primary'}
      onClick={handleAction}
      sx={{
        width: '100%',
        height: '64px',
        borderRadius: '4px',
        maxWidth: '350px',
        flexDirection: 'column',
        marginTop: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      <>
        {Boolean(text) && (
          <Typography sx={{ fontSize: text.length >= 20 ? '16px' : '18px' }}>
            {upperFirst(text)}
          </Typography>
        )}
        {!hideWaitTime && Boolean(waitText) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccessTimeIcon sx={{ marginRight: '5px' }} />
            <Typography sx={{ fontSize: '12px' }}>
              {waitText.toUpperCase()}
            </Typography>
          </Box>
        )}
      </>
    </Button>
  );
};

export default ActionButtonContent;
