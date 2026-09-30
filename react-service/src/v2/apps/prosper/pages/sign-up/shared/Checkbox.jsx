import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import MuiCheckbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';

const Checkbox = ({
  value,
  handleChange,
  label,
  name,
  handleClick = () => null,
}) => (
  <Grid item>
    <FormControlLabel
      control={<MuiCheckbox onChange={handleChange} onClick={handleClick} />}
      value={value}
      name={name}
      label={label}
    />
  </Grid>
);

export default Checkbox;
