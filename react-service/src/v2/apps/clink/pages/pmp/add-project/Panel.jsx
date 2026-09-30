import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid'; // TODO: To change to Grid2
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import AddIcon from 'v1/global/public/images/svg/add.svg';

const { clinkGreen, white, clinkPurple, lightGray3 } = CONSTANTS.colors.general;

const text = {
  color: clinkGreen,
  fontSize: '18px',
  fontWeight: 'bold',
  textAlign: 'center',
};
const icon = {
  border: `1px solid ${clinkGreen}`,
  width: '64px',
  height: '64px',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  marginBottom: '16px',
};
const Panel = ({ handleClick }) => (
  <Grid
    data-testid="add-project-panel-trigger"
    onClick={handleClick}
    item
    xs={12}
    sm={4}
    md={3}
    lg={2}
    sx={{ boxSizing: 'border-box' }}
  >
    <Grid
      container
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        height: '210px',
        cursor: 'pointer',
        border: `1px solid ${clinkGreen}`,
        borderRadius: '8px',
        boxSizing: 'border-box',
        backgroundColor: white,
        boxShadow: 4,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: lightGray3,
          boxShadow: 8,
          borderColor: clinkPurple,
          borderWidth: '2px',
          '& > div:first-of-type': {
            borderColor: clinkPurple,
            borderWidth: '1px',
          },
        },
      }}
    >
      <Grid container item sx={icon}>
        <AddIcon />
      </Grid>
      <Grid item>
        <Typography sx={text}>Add new project</Typography>
      </Grid>
    </Grid>
  </Grid>
);


Panel.propTypes = {
  handleClick: PropTypes.func.isRequired,
};

export default Panel;
