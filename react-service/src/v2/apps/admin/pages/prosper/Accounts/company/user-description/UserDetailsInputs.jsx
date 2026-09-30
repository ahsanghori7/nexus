import React from 'react';
import Box from '@mui/material/Box';
import {
  CompanyFirstName,
  CompanyLastName,
  UserEmail,
  CompanyJobDescription,
} from '../details/inputs';

const boxStyles = {
  display: 'flex',
  flexWrap: { xs: 'wrap', md: 'nowrap' },

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
  <>
    <Box sx={boxStyles}>
      <CompanyFirstName register={register} errors={errors} value={data} />
      <CompanyLastName register={register} errors={errors} value={data} />
    </Box>
    <Box sx={boxStyles}>
      <CompanyJobDescription register={register} errors={errors} value={data} />
      <UserEmail register={register} errors={errors} value={data} />
    </Box>
  </>
);

export default UserDetailsInputs;
