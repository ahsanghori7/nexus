import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import i18next from 'v2/helpers/i18n';
import {
  startFromScratchActionButtonSx,
  startFromScratchAddIconSx,
  startFromScratchCardDisabledSx,
  startFromScratchCardSx,
  startFromScratchDescriptionSx,
  startFromScratchIconBoxSx,
  startFromScratchIconSx,
  startFromScratchTitleSx,
} from './cardStyles';

const StartFromScratchCard = ({ onStart = () => null, disabled = false }) => {
  return (
    <Box
      sx={{
        ...startFromScratchCardSx,
        ...(disabled && startFromScratchCardDisabledSx),
      }}
    >
      <Box>
        <Box sx={startFromScratchIconBoxSx}>
          <EditOutlinedIcon sx={startFromScratchIconSx} />
        </Box>
        <Typography component="h2" sx={startFromScratchTitleSx}>
          {i18next.t('boq-start-from-scratch')}
        </Typography>
        <Typography sx={startFromScratchDescriptionSx}>
          {i18next.t('boq-create-list-items')}
        </Typography>
      </Box>

      <Button
        onClick={onStart}
        variant="outlined"
        fullWidth
        startIcon={<AddIcon sx={startFromScratchAddIconSx} />}
        disabled={disabled}
        sx={startFromScratchActionButtonSx}
      >
        {i18next.t('boq-add-items-manually')}
      </Button>
    </Box>
  );
};

export default StartFromScratchCard;
