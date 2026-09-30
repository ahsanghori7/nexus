import * as React from 'react';
import { connect } from 'react-redux';
import Button from '@mui/material/Button';
import flag from 'v2/helpers/flags';
import DownloadIcon from '@mui/icons-material/Download';
import IFS from './ifs-logo-white-small.svg';
import ASITE from './Asite-Logo-3-small-2-cropped.svg';

/* eslint-disable react/react-in-jsx-scope*/
const buttonList = {
  ifs: {
    label: 'Import/Update',
    Component: <IFS />,
    variant: 'contained',
    color: 'primary',
    sx: { bgcolor: '#360065' },
  },
  ifs2: {
    label: 'Download Excel',
    Component: <DownloadIcon />,
    variant: 'contained',
    color: 'primary',
    sx: {},
  },
  ifs3: {
    label: 'Approval Workflow',
    Component: <IFS />,
    variant: 'contained',
    color: 'primary',
    sx: { bgcolor: '#360065' },
  },
  asite: {
    label: 'ASite Import',
    color: 'secondary',
    Component: <ASITE />,
    variant: 'outlined',
    sx: {},
  },
  operational: {
    label: 'Delivery Guide',
    color: 'secondary',
    Component: null,
    variant: 'contained',
    sx: {},
  },
};

function DemoButton({ type = 'ifs', clinkAccount, handleClick = () => null }) {
  if (!flag('DEMO_FEATURE')?.includes(Number(clinkAccount?.id))) {
    return null;
  }

  const getType = buttonList[type];

  if (!getType?.label) {
    return null;
  }

  return (
    <Button
      color={getType.color}
      variant={getType.variant}
      sx={getType.sx}
      startIcon={getType.Component}
      onClick={handleClick}
    >
      {getType.label}
    </Button>
  );
}

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(DemoButton);
