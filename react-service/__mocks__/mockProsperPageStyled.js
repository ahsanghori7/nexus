// Mock for prosper shared styled components
import React from 'react';

export const StyledSection = ({ children, ...props }) => (
  <section {...props} data-testid="styled-section">{children}</section>
);

export const StyledText = ({ children, ...props }) => (
  <div {...props} data-testid="styled-text">{children}</div>
);

export const StyledParagraph = ({ children, ...props }) => (
  <p {...props} data-testid="styled-paragraph">{children}</p>
);

export const StyledStrong = ({ children, ...props }) => (
  <strong {...props} data-testid="styled-strong">{children}</strong>
);

export const StyledTitle = ({ children, ...props }) => (
  <h1 {...props} data-testid="styled-title">{children}</h1>
);

export const Slide = ({ children, ...props }) => (
  <div {...props} data-testid="slide">{children}</div>
);

export const Winners = ({ children, ...props }) => (
  <div {...props} data-testid="winners">{children}</div>
);

export const CompanyLink = ({ children, ...props }) => (
  <a {...props} data-testid="company-link">{children}</a>
);

const StyledContainer = ({ children, ...props }) => (
  <div {...props} data-testid="styled-container">{children}</div>
);

export default StyledContainer;
