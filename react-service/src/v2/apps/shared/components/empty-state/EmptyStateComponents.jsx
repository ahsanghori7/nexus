import React from 'react';
import PropTypes from 'prop-types';
import Grid2 from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import {
  athensGray,
  darkLightGrey,
  ghostWhite2,
  lightGreenBg2,
  errorPink,
} from 'v2/constants/colors';

const getSizeStyles = (size) => {
  const sizes = {
    small: { minHeight: 178 },
    default: { minHeight: 252 },
    large: { minHeight: 300 },
  };
  return sizes[size] || sizes.default;
};

const OuterBox = ({ children, sx }) => (
  <Grid2
    container
    role="status"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 2,
      width: '100%',
      minWidth: 0,
      backgroundColor: 'transparent',
      ...sx,
    }}
  >
    {children}
  </Grid2>
);

OuterBox.propTypes = {
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};

const InnerBox = ({ children, size = 'default', variant = 'generic' }) => (
  <Grid2
    sx={{
      width: '100%',
      minWidth: 0,
      px: { xs: 2, sm: 3 },
      py: { xs: 3, sm: 4 },
      ...getSizeStyles(size),
      ...(variant !== 'table' && {
        backgroundColor: ghostWhite2,
        borderRadius: '8px',
        borderWidth: '1px',
        borderStyle: 'dashed',
        borderColor: darkLightGrey,
      }),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      boxSizing: 'border-box',
    }}
  >
    {children}
  </Grid2>
);

InnerBox.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  variant: PropTypes.oneOf(['generic', 'search', 'firstUse', 'error', 'table']),
};

const IconBox = ({ icon, variant = 'generic', backgroundColor }) => {
  const variantBgStyles = {
    firstUse: { backgroundColor: lightGreenBg2 },
    error: { backgroundColor: errorPink },
  };

  const bgColor =
    backgroundColor || variantBgStyles[variant]?.backgroundColor || athensGray;

  return (
    <Grid2
      sx={{
        width: 48,
        height: 48,
        borderRadius: '8px',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
      }}
    >
      {icon}
    </Grid2>
  );
};

IconBox.propTypes = {
  icon: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['generic', 'search', 'firstUse', 'error', 'table']),
  backgroundColor: PropTypes.string,
};

const ActionButton = ({
  action,
  variant = 'contained',
  icon: Icon = AddIcon,
}) => {
  const FinalIcon = action.icon || Icon;

  return (
    <Button
      variant={variant}
      color="primary"
      onClick={action.onClick}
      sx={{
        fontSize: '14px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
      }}
      startIcon={<FinalIcon />}
    >
      {action.label}
    </Button>
  );
};

ActionButton.propTypes = {
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }).isRequired,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  icon: PropTypes.elementType,
};

export { IconBox, ActionButton, OuterBox, InnerBox };
