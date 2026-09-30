import { Container } from '@mui/material';
import React from 'react';

const AccessStateWrapper = ({ component: Component, ownerAccountName }) => {
  return (
    <Container maxWidth="md" sx={{
       height: '80vh',
       display: 'flex',
       flexDirection: 'column',
       justifyContent: 'center',
       alignItems: 'center',
    }}>
      <Component ownerAccountName={ownerAccountName} />
    </Container>
  );
};

export default AccessStateWrapper;
