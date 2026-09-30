import React from 'react';
import Box from '@mui/material/Box';
import TableTooltip from './TableTooltip';
import { getBoqMultilineCellSx, normalizeBoqLineBreaks } from './boqLineText';

const BoqMultilineCell = ({ value, emptyPlaceholder = '-' }) => {
  const normalized = normalizeBoqLineBreaks(value);
  if (!normalized) {
    return emptyPlaceholder;
  }
  return (
    <TableTooltip
      content={
        <Box component="span" sx={getBoqMultilineCellSx(normalized)}>
          {normalized}
        </Box>
      }
      title={normalized}
    />
  );
};

export default BoqMultilineCell;
