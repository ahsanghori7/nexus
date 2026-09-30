import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import FieldHolderV1 from '../../../../../global/components/clink-form/FieldHolder';
import FieldLabel from '../../../../../global/components/clink-form/FieldLabel';

const { black } = CONSTANTS.colors.general;

const FieldHolder = ({ full, name, label, children, error, required = true }) => (
  <FieldHolderV1
    className={`${full ? 'full' : ''} ${
      (error && error[name] && 'input-error') || ''
    }`}
  >
    <FieldLabel
      name={name}
      label={label}
      required={required}
      labelError
      customErrors={error}
      triggerCustomErrors
    />
    {children}
  </FieldHolderV1>
);

const MuiInputLabel = ({ children }) => {
  return (
    <InputLabel
      sx={{
        top: '-40px !important',
        left: -10,
        fontSize: '14px',
        fontWeight: 600,
        color: black,
      }}
    >
      {children}
      <Typography
        component="span"
        variant="caption"
        color="error"
        sx={{ fontSize: '14px', fontWeight: 600 }}
      >
        {' '}
        *
      </Typography>
    </InputLabel>
  );
};

export { MuiInputLabel };

export default FieldHolder;
