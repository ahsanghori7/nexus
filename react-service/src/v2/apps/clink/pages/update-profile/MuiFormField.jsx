// TODO: Keep working on this page to migrate legacy update profile page
import React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BusinessIcon from '@mui/icons-material/Business';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import EmailIcon from '@mui/icons-material/Email';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import LockIcon from '@mui/icons-material/Lock';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonIcon from '@mui/icons-material/Person';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import PlaceIcon from '@mui/icons-material/Place';
import WebIcon from '@mui/icons-material/Web';
import WorkIcon from '@mui/icons-material/Work';
import { CONSTANTS } from 'clink-components';

const { clinkPurple, white } = CONSTANTS.colors.general;

const iconStyle = { marginRight: '4px', height: '18px' };

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: clinkPurple,
  mb: '4px',
};

const textFieldStyle = {
  height: '40px',
};

const RegNumber = () => {
  return (
    <Box sx={{ width: '28px', position: 'relative', display: 'inline-block' }}>
      <Typography
        sx={{
          fontSize: '32px',
          position: 'absolute',
          zIndex: 5,
          left: '4px',
          top: '-25px',
        }}
        component="span"
      >
        ®
      </Typography>
    </Box>
  );
};

const MuiFormField = ({
  onChange = () => null,
  value = '',
  name = '',
  type = 'text',
  errorMessage = '',
}) => {
  const inputMap = {
    'user[firstname]': {
      icon: <PersonIcon sx={iconStyle} />,
      labelName: 'First Name',
      required: true,
    },
    'user[lastname]': {
      icon: <PersonIcon sx={iconStyle} />,
      labelName: 'Last Name',
      required: true,
    },
    'user[contact_number]': {
      icon: <LocalPhoneIcon sx={iconStyle} />,
      labelName: 'Contact Number',
      required: false,
    },
    'user[email]': {
      icon: <EmailIcon sx={iconStyle} />,
      labelName: 'Email',
      required: true,
    },
    'user[job_title]': {
      icon: <WorkIcon sx={iconStyle} />,
      labelName: 'Job Title',
      required: false,
    },
    'user[display_name]': {
      icon: <DriveFileRenameOutlineIcon sx={iconStyle} />,
      labelName: 'Display Name',
      required: false,
    },
    'user[password]': {
      icon: <LockIcon sx={iconStyle} />,
      labelName: 'New Password',
      required: false,
    },
    password_confirm: {
      icon: <EnhancedEncryptionIcon sx={iconStyle} />,
      labelName: 'Repeat New Password',
      required: false,
    },
    'account[name]': {
      icon: <BusinessIcon sx={iconStyle} />,
      labelName: 'Company Name',
      required: true,
    },
    'account[reg_number]': {
      icon: <RegNumber />,
      labelName: 'Registration Number',
      required: false,
    },
    'account[address]': {
      icon: <PlaceIcon sx={iconStyle} />,
      labelName: 'Company Address',
      required: false,
    },
    'account[landline]': {
      icon: <PhoneCallbackIcon sx={iconStyle} />,
      labelName: 'Company Landline Number',
      required: false,
    },
    'account[email]': {
      icon: <MailOutlineIcon sx={iconStyle} />,
      labelName: 'Company Email',
      required: true,
    },
    'account[website]': {
      icon: <WebIcon sx={iconStyle} />,
      labelName: 'Company Website',
      required: false,
    },
  };

  const { icon, required, labelName } = inputMap[name] || {};

  const handleKeyDown = (e) => {
    if ((name === 'firstname' || name === 'lastname') && /\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <FormControl fullWidth margin="normal" sx={{ my: 1, mx: 0 }}>
      <Typography
        sx={{ ...labelStyle, position: 'relative' }}
        component="label"
        variant="body1"
      >
        {icon} {labelName}
        {required && <span style={{ color: 'red' }}> *</span>}
      </Typography>

      <TextField
        sx={{
          ...textFieldStyle,
          '& input[type=number]': {
            MozAppearance: 'textfield',
          },
          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
          {
            WebkitAppearance: 'none',
            margin: 0,
          },
        }}
        variant="outlined"
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        error={Boolean(errorMessage)}
        helperText={errorMessage}
        required={required}
        onKeyDown={handleKeyDown}
        InputProps={{
          sx: {
            height: '40px',
            p: 0,
            backgroundColor: white,
            '& .MuiInputBase-input': {
              padding: '4px 8px',
            },
          },
        }}
      />
    </FormControl>
  );
};

export default MuiFormField;
