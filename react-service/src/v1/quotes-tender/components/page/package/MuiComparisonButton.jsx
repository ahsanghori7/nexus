import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import flag from 'v2/helpers/flags';

const { clinkGreen, white } = CONSTANTS.colors.general;

const MuiComparisonButton = ({ tid, slug }) => {
  const navigate = useNavigate();

  if (!flag('TENDER_ANALYSIS')) {
    return false;
  }

  return (
    <Button
      sx={{
        backgroundColor: white,
        color: clinkGreen,
        fontSize: '15px',
        border: `1px solid ${clinkGreen}`,
        borderRadius: '32px',
        textTransform: 'unset',
        marginRight: '16px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      onClick={() =>
        navigate(`/main-contractor/project/${slug}/boq/${tid}/tender_analysis`)
      }
    >
      {i18next.t('boq-compare-quotes')}
    </Button>
  );
};

export default MuiComparisonButton;
