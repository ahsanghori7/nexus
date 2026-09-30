import React from 'react';
import isString from 'lodash/isString';
import { useTranslation } from 'react-i18next';
import Chip from '@mui/material/Chip';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Image } from 'clink-components';
import { getStatus, getDaysToShow } from 'v2/helpers/status/enquiries';

const Subheader = ({ data }) => {
  const { t } = useTranslation();
  const currentStatus = getStatus(data);
  const daysToShow = getDaysToShow(data);
  const countText =
    daysToShow && Number(daysToShow) > 1 ? 'text-in-days' : 'text-in-day';
  const waitText = daysToShow ? t(countText, { count: daysToShow }) : '';
  const Icon = currentStatus ? currentStatus.dark : null;
  const label = currentStatus ? currentStatus.label : null;
  const bgColor = currentStatus ? currentStatus.bg : null;
  const color = currentStatus ? currentStatus.color : null;
  const waiting = currentStatus ? currentStatus.waiting : null;

  return (
    <CardActions sx={{ width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" alignItems="center">
            {Boolean(Icon) && (
              <Avatar sx={{ width: 25, height: 25, bgcolor: bgColor }}>
                {isString(Icon) ? (
                  <Image src={Icon} />
                ) : (
                  <Icon sx={{ fontSize: '1rem' }} />
                )}
              </Avatar>
            )}
            <Typography
              ml={0.5}
              sx={{
                marginTop: '5px',
                fontSize: '10px',
                color,
                fontWeight: 'bold',
              }}
            >
              {t(label).toUpperCase()}
            </Typography>
          </Stack>
          {Boolean(waiting) && (
            <Chip
              variant="outlined"
              color="error"
              label={
                <Box sx={{ marginTop: '3px' }}>
                  {`${t(waiting).toUpperCase()} ${waitText.toUpperCase()}`}
                </Box>
              }
              icon={<AccessTimeIcon />}
              sx={{
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '6px',
                lineHeight: 1.5,
              }}
            />
          )}
        </Stack>
      </Box>
    </CardActions>
  );
};

export default Subheader;
