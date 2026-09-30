// Mock for prosper Theme.styled components
const React = require('react');

// Create mock styled components
const StyledWrapper = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-wrapper',
    ...props
  }, children)
);

const StyledInnerWrapper = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-inner-wrapper',
    ...props
  }, children)
);

const StyledWithMarginAndLoader = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-with-margin-and-loader',
    ...props
  }, children)
);

const StyledPegasusContainer = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-pegasus-container',
    ...props
  }, children)
);

const StyledProsperContainer = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-prosper-container',
    ...props
  }, children)
);

const StyledFull = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-full',
    ...props
  }, children)
);

const StyledFullProsper = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-full-prosper',
    ...props
  }, children)
);

const StyledPegasusColumn = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-pegasus-column',
    ...props
  }, children)
);

const StyledProsperColumn = ({ children, ...props }) => (
  React.createElement('div', {
    'data-testid': 'styled-prosper-column',
    ...props
  }, children)
);

module.exports = {
  StyledWrapper,
  StyledInnerWrapper,
  StyledWithMarginAndLoader,
  StyledPegasusContainer,
  StyledProsperContainer,
  StyledFull,
  StyledFullProsper,
  StyledPegasusColumn,
  StyledProsperColumn,
};
