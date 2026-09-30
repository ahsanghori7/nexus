// Mock for v2/apps/prosper/shared/carousel
import React from 'react';

const ProsperCarousel = ({ children, showThumbs, showStatus, centerMode, showIndicators, renderArrowPrev, renderArrowNext, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'prosper-carousel',
    className: 'prosper-carousel-mock',
    ...props
  }, children);
};

export default ProsperCarousel;
