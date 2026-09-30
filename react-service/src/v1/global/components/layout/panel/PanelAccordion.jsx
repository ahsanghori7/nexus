import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function PanelAccordion({
  id = null,
  title,
  children,
  defaultExpanded = false,
}) {
  return (
    <Accordion defaultExpanded={defaultExpanded} id={id}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
        sx={{
            '& .MuiAccordionSummary-expandIconWrapper': {
            alignSelf: 'flex-start',
            mt: '22px',
          },
          '&.Mui-focusVisible': {
            backgroundColor: 'transparent',
          },
          '&:active': {
            backgroundColor: 'transparent',
          },
        }}
      >
        {title}
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

PanelAccordion.propTypes = {
  id: PropTypes.node,
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  defaultExpanded: PropTypes.bool,
};

PanelAccordion.defaultProps = {
  id: null,
  defaultExpanded: false,
};
