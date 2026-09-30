import React, { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Remove as RemoveIcon, Add as AddIcon } from '@mui/icons-material';
import { CONSTANTS } from 'clink-components';

const { clinkLightPurple } = CONSTANTS.colors.general;

const SimpleAccordion = ({ children, title = '', id }) => {
  const [expanded, setExpanded] = useState(true);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box
      id={id}
      sx={{
        width: '100%',
        border: `1px solid ${clinkLightPurple}`,
        borderRadius: '8px',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Accordion
        expanded={expanded}
        onChange={handleToggle}
        sx={{
          boxShadow: 'none',
          borderRadius: '16px',
        }}
      >
        <AccordionSummary
          sx={{
            '& .MuiAccordionSummary-expandIconWrapper': {
              position: 'absolute',
              top: 0,
              right: 0,
              borderBottom: `1px solid ${clinkLightPurple}`,
              borderLeft: `1px solid ${clinkLightPurple}`,
              borderTop: 'none',
              borderRight: 'none',

              '&.Mui-expanded': {
                borderBottom: 'none',
                borderLeft: 'none',
                borderTop: `1px solid ${clinkLightPurple}`,
                borderRight: `1px solid ${clinkLightPurple}`,
              },
            },
          }}
          expandIcon={
            <IconButton size="small">
              {expanded ? <RemoveIcon /> : <AddIcon />}
            </IconButton>
          }
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ fontSize: '24px', px: 2, py: 1 }}>
            {title}
          </Typography>
        </AccordionSummary>
        {children && (
          <Box
            sx={{
              borderTop: `1px solid ${clinkLightPurple}`,
              borderBottom: `1px solid ${clinkLightPurple}`,
              mb: 3,
            }}
          >
            {children}
          </Box>
        )}
      </Accordion>
    </Box>
  );
};

export default SimpleAccordion;
