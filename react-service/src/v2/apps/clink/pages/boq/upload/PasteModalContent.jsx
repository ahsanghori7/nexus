import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import {
  MuiModalTable,
  MuiModalTextarea,
  MuiModalButton,
} from './modal-components.mui';

const { clinkGreen, clinkLightPurple } = CONSTANTS.colors.general;

const PasteModalContent = () => {
  const [original, setOriginal] = useState([]);

  useEffect(() => {
    // COPY PASTE TREATMENT
    const handlePasteAnywhere = (event) => {
      const newText = event.clipboardData.getData('text');

      // Split the data into rows
      const rows = newText
        .trim()
        .split('\n')
        .map((row) => row.split('\t'));

      setOriginal(rows);
    };
    window.addEventListener('paste', handlePasteAnywhere);

    return () => {
      window.removeEventListener('paste', handlePasteAnywhere);
    };
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        position: 'relative',
      }}
    >
      <Box sx={{ marginTop: '-10px' }}>
        <Typography sx={{ fontSize: '22px' }}>
          {i18next.t('boq-paste-table-data')}
        </Typography>
        <Typography sx={{ fontSize: '14px' }}>
          {i18next.t('boq-paste-description')}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          minHeight: 200,
          border: `1px solid ${clinkLightPurple}`,
          borderRadius: '6px',
          p: 0,
          my: 2,
          '& .handsontable': {
            display: original?.length ? 'block' : 'none',
          },
        }}
      >
        {original?.length ? (
          <MuiModalTable tableContent={original} />
        ) : (
          <MuiModalTextarea placeholder={i18next.t('boq-paste-here')} />
        )}
      </Box>
      {original?.length ? (
        <>
          <Typography sx={{ fontSize: '14px' }}>
            {`${original.length} rows and ${original[0].length} columns with headers:`}
          </Typography>
          <MuiModalButton
            sx={{
              backgroundColor: clinkGreen,
              mt: 1,
              '&:hover': { backgroundColor: clinkGreen },
            }}
          >
            {i18next.t('continue')}
          </MuiModalButton>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};

export default PasteModalContent;
