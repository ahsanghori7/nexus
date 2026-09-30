import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { CONSTANTS } from 'clink-components';

const { prosperBoxRed } = CONSTANTS.colors.prosper;
const { cultured, white } = CONSTANTS.colors.general;

const StyledSwitch = styled(({ register, name, value, ...props }) => (
  <Switch
    sx={{ m: 1 }}
    focusVisibleClassName=".Mui-focusVisible"
    disableRipple
    defaultChecked={value}
    {...register(name)}
    {...props}
  />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: white,
      '& + .MuiSwitch-track': {
        backgroundColor: prosperBoxRed,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: prosperBoxRed,
      border: `6px solid ${white}`,
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: cultured,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

const SwitchBox = ({
  checkboxLabel = '',
  name = 'switch',
  value = null,
  register = () => { },
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box>
        <FormControlLabel
          control={
            <StyledSwitch register={register} name={name} value={value} />
          }
        />
      </Box>
      {Boolean(checkboxLabel && checkboxLabel.length) && (
        <Typography sx={{ fontSize: '14px', fontWeight: 300 }}>
          {checkboxLabel}
        </Typography>
      )}
    </Box>
  );
};

export default SwitchBox;
