// Mock for collapse enquiries components
import React from 'react';

const mockExpandCollapse = ({ expanded, handleChangeExpanded, id }) => (
  <button
    data-testid="expand-collapse-button"
    aria-expanded={expanded.includes(id)}
    aria-label="show more"
    onClick={() => handleChangeExpanded(id)}
  >
    <span data-testid="expand-more-icon">expand_more</span>
  </button>
);

module.exports = mockExpandCollapse;
