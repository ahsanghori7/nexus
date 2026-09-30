import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Title, { titleStyle } from './Title';
import Signature from './Signature';

const Docusign = ({ useSignature, status }) => (
  <Box pl={2} pr={2} pb={2} data-testid="document-creator-signature-section">
    <Paper>
      <Title text="Order signature" />
      <Typography {...titleStyle} fontWeight={400} fontSize={16}>
        Choose how you want to proceed with document signing by selecting an
        option from the dropdown menu below.
      </Typography>
      <Signature useSignature={useSignature} status={status} />
    </Paper>
  </Box>
);

export default Docusign;
