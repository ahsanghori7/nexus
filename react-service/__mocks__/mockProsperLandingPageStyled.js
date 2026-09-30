// Mock for prosper styled components used in resources pages
import React from 'react';

export const StyledWrapper = ({ children, ...props }) => (
  <div {...props} data-testid="styled-wrapper">{children}</div>
);

export const StyledWrapperLeft = ({ children, ...props }) => (
  <div {...props} data-testid="styled-wrapper-left">{children}</div>
);

export const StyledContentLeft = ({ children, ...props }) => (
  <div {...props} data-testid="styled-content-left">{children}</div>
);

export const StyledWrapperRight = ({ children, ...props }) => (
  <div {...props} data-testid="styled-wrapper-right">{children}</div>
);

export const StyledContentRight = ({ children, ...props }) => (
  <div {...props} data-testid="styled-content-right">{children}</div>
);

export const StyledRedLink = ({ children, ...props }) => (
  <a {...props} data-testid="styled-red-link">{children}</a>
);

export const StyledBold = ({ children, ...props }) => (
  <strong {...props} data-testid="styled-bold">{children}</strong>
);

export const StyledRed = ({ children, ...props }) => (
  <span {...props} data-testid="styled-red">{children}</span>
);

export const StyledP = ({ children, ...props }) => (
  <p {...props} data-testid="styled-p">{children}</p>
);

export const StyledTitle = ({ children, ...props }) => (
  <h1 {...props} data-testid="styled-title">{children}</h1>
);

export const StyledTitle2 = ({ children, ...props }) => (
  <h2 {...props} data-testid="styled-title2">{children}</h2>
);

export const StyledDescription = ({ children, ...props }) => (
  <p {...props} data-testid="styled-description">{children}</p>
);

export const StyledDiscalimer = ({ children, ...props }) => (
  <div {...props} data-testid="styled-disclaimer">{children}</div>
);

export const StyledVideo = ({ children, ...props }) => (
  <div {...props} data-testid="styled-video">{children}</div>
);

export const StyledVideoOld = ({ children, ...props }) => (
  <iframe {...props} data-testid="styled-video-old">{children}</iframe>
);

export const StyledContainer = ({ children, ...props }) => (
  <div {...props} data-testid="styled-container">{children}</div>
);

export const StyledTextContainer = ({ children, ...props }) => (
  <div {...props} data-testid="styled-text-container">{children}</div>
);

export const StyledSmallVideo = ({ children, ...props }) => (
  <div {...props} data-testid="styled-small-video">{children}</div>
);

export const StyledButtonWrapper = ({ children, ...props }) => (
  <div {...props} data-testid="styled-button-wrapper">{children}</div>
);

// Default export for when imported with import StyledContainer, { ... }
const StyledContainerDefault = StyledContainer;
export default StyledContainerDefault;
