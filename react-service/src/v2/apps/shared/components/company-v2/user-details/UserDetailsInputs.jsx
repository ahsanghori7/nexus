import React from 'react';
import Box from '@mui/material/Box';

import {
  CompanyFirstName,
  CompanyLastName,
  UserEmail,
  CompanyJobDescription,
} from '../company-details/inputs';

const boxStyles = {
  display: 'flex',
  flexDirection: 'column',

  '& input': {
    borderRadius: '5px!important',
  },

  '& > .clink-form__input': {
    position: 'relative',
    '& > .clink-form__error': {
      position: 'absolute',
      bottom: '-10px',
      left: '9px',
    },
  },
};

const UserDetailsInputs = ({ data, register, errors }) => (
  <Box sx={boxStyles}>
    <CompanyJobDescription register={register} errors={errors} value={data} />
    <CompanyFirstName register={register} errors={errors} value={data} />
    <CompanyLastName register={register} errors={errors} value={data} />
    <UserEmail register={register} errors={errors} value={data} />
  </Box>
);

export default UserDetailsInputs;
