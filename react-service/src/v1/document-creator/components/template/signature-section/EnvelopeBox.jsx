import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { IN_QUEUE } from 'v2/helpers/status/orders';

const { ghostWhite } = CONSTANTS.colors.general;

const EnvelopeBox = ({ info, status }) => {
  const envelopes = 'envelopes' in info ? info.envelopes : null;
  const [envelopesLabel, setEnvelopesLabel] = useState('');

  useEffect(() => {
    const reduceEnvelopeLogic = status === IN_QUEUE ? 1 : 0;
    if (envelopes && Number(envelopes.current) - reduceEnvelopeLogic > 1) {
      const current = Number(envelopes.current) - reduceEnvelopeLogic;
      setEnvelopesLabel(
        `${current}/${envelopes.envelopes} available envelopes`,
      );
    } else if (
      envelopes &&
      Number(envelopes.current) - reduceEnvelopeLogic === 1
    ) {
      const current = Number(envelopes.current) - reduceEnvelopeLogic;
      setEnvelopesLabel(`${current}/${envelopes.envelopes} available envelope`);
    } else {
      setEnvelopesLabel('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  return (
    <Box pl={2} pr={2} pb={2}>
      <Paper
        sx={{ py: 1, px: 4, backgroundColor: ghostWhite, textAlign: 'center' }}
      >
        {Boolean(envelopesLabel) && (
          <>
            <Typography
              sx={{ fontWeight: 600, fontSize: '15px', opacity: 0.75 }}
            >
              {envelopesLabel}
            </Typography>
            <Typography
              sx={{ fontWeight: 500, fontSize: '12px', opacity: 0.5 }}
            >
              If you need more, please contact your account manager
            </Typography>
          </>
        )}
        {!envelopesLabel && (
          <Typography sx={{ fontWeight: 500, fontSize: '12px', opacity: 0.5 }}>
            Please contact your account manager to get more envelopes
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default EnvelopeBox;
