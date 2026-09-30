import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Container from 'v2/apps/prosper/pages/projects/Container.styled';
import Matched from './Matched';
import Other from './Other';

const Packages = ({
  project,
  subcontractor,
  handleRegister,
  open,
  unlocked = false,
}) => (
  <Box
    sx={{
      padding: 3,
    }}
  >
    <Container>
      <Grid container flexDirection="column">
        <Matched
          unlocked={unlocked}
          project={project}
          subcontractor={subcontractor}
          handleRegister={handleRegister}
          open={open}
        />
        <Other
          unlocked={unlocked}
          project={project}
          subcontractor={subcontractor}
          handleRegister={handleRegister}
        />
      </Grid>
    </Container>
  </Box>
);

export default Packages;
