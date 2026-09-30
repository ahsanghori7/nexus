import React, { useState, useEffect } from 'react';
import i18next from 'v2/helpers/i18n';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { checkIfImageExists } from 'v2/helpers/url';
import { DIRECTOR } from 'v2/helpers/prequal/organization';
import Doc from '../Doc';

const { iconHammerBlack } = CONSTANTS.s3;
const { black, grayDark } = CONSTANTS.colors.general;
const { dimGray2 } = CONSTANTS.colors.prosper;

const Member = ({ data = {}, color = 'white', actions = [] }) => {
  const [logoExists, setLogoExists] = useState(false);

  useEffect(() => {
    if (data && data.logo) {
      checkIfImageExists(data.logo, (exists) => {
        setLogoExists(exists);
      });
    }
  }, [logoExists, data]);
  return (
    <Doc actions={actions}>
      <Grid
        item
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexBasis: '80px',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            backgroundColor: color,
          }}
        >
          <Avatar
            alt={i18next.t('profile-logo')}
            src={logoExists ? data.logo : iconHammerBlack}
            variant="rounded"
            sx={{
              backgroundColor: grayDark,
              width: 64,
              height: 64,
              boxSizing: 'border-box',
              borderRadius: '50%',
              '& img': { objectFit: 'contain' },
            }}
          />
        </Box>
      </Grid>
      <Grid
        container
        item
        flexDirection="column"
        sx={{
          fontSize: '16px',
          color: black,
          padding: 0,
          flexBasis: 'calc(100% - 80px)',
          paddingLeft: '4px',
        }}
      >
        {Boolean(data) && (
          <Typography
            sx={{
              fontSize: '16px',
              lineHeight: '1.7',
              pr: 4,
              wordBreak: 'break-word',
            }}
          >
            {`${data.firstname || ''}${data.firstname && data.lastname ? ' ' : ''}${data.lastname || ''}`}
          </Typography>
        )}
        {Boolean(data) && (
          <>
            <Typography
              sx={{
                fontSize: '16px',
                lineHeight: '1.7',
                fontWeight: 300,
                color: dimGray2,
                wordBreak: 'break-word',
              }}
            >
              {data.title || DIRECTOR.value}
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                lineHeight: '1.7',
                fontWeight: 300,
                color: dimGray2,
                wordBreak: 'break-word',
              }}
            >
              {data.email || 'E-mail'}
            </Typography>
          </>
        )}
      </Grid>
    </Doc>
  );
};

export default Member;
