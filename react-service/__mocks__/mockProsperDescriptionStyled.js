// Mock for prosper description styled components
const React = require('react');

// Create mock styled components
const StyledDescriptionItem = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-description-item',
    ...props
  }, children)
);

const StyledDescriptionItemContent = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-description-item-content',
    ...props
  }, children)
);

module.exports = {
  StyledDescriptionItem,
  StyledDescriptionItemContent,
};
