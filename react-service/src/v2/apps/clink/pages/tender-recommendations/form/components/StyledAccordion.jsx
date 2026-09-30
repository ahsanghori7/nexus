import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  ThemeProvider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { accordionTheme } from '../theme/accordionTheme';
import Divider from '@mui/material/Divider';

const StyledAccordion = ({ title, expanded, onChange, children, 'data-testid': dataTestId }) => {
  return (
    <ThemeProvider theme={accordionTheme}>
      <Accordion
        data-testid={dataTestId}
        expanded={expanded}
        onChange={onChange}
        disableGutters
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ fontSize: 28 }} />}
          sx={{ px: 2 }}
        >
          <Typography fontWeight={600}>{title}</Typography>
        </AccordionSummary>
        <Divider sx={{ mb: 2 }} />
        <AccordionDetails>{children}</AccordionDetails>
      </Accordion>
    </ThemeProvider>
  );
};

export default StyledAccordion;
