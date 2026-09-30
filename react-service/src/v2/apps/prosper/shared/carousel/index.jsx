import React from 'react';
import { Carousel, CONSTANTS } from 'clink-components';
import ArrowButton from './ArrowButton';

const { redCaretLeft, redCaretRight } = CONSTANTS.s3;

const defaultRenderArrow =
  (className = 'control-arrow control-prev', icon = redCaretLeft) =>
  (nextItem, label) =>
    (
      <ArrowButton
        nextItem={nextItem}
        label={label}
        src={icon}
        className={className}
      />
    );

const ProsperCarousel = ({ children, carouselProps = {} }) => {
  const props = { ...carouselProps };
  if (!carouselProps.renderArrowPrev) {
    props.renderArrowPrev = defaultRenderArrow();
  }
  if (!carouselProps.renderArrowNext) {
    props.renderArrowNext = defaultRenderArrow(
      'control-arrow control-next',
      redCaretRight
    );
  }
  return <Carousel {...props}>{children}</Carousel>;
};

export default ProsperCarousel;
