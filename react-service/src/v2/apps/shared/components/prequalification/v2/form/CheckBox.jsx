import React from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

import { CONSTANTS } from 'clink-components';

const { prosperBoxRed } = CONSTANTS.colors.prosper;

const CheckBox = ({ checkboxLabel = '' }) => {
  return (
    <Box sx={{ ml: '-14px', display: 'flex', alignItems: 'center' }}>
      <Box>
        <Checkbox
          defaultChecked
          sx={{
            '&.Mui-checked': {
              color: prosperBoxRed,
            },
            '& .MuiSvgIcon-root': { fontSize: 30, p: 0 },
          }}
        />
      </Box>
      {Boolean(checkboxLabel && checkboxLabel.length) && (
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
          {checkboxLabel}
        </Typography>
      )}
    </Box>
  );
};

export default CheckBox;
