import React from 'react';
import {
  CarouselProvider,
  Slider,
  ButtonBack,
  ButtonNext,
} from 'pure-react-carousel';

const SliderCarousel = ({
  children,
  className,
  goBack = 'Back',
  goNext = 'Next',
  slideHeight = '10',
  slideWidth = '10',
  totalSlides = '6',
  visibleSlides = '2',
  showNavigation = true,
}) => (
  <CarouselProvider
    naturalSlideWidth={slideWidth}
    naturalSlideHeight={slideHeight}
    totalSlides={totalSlides}
    visibleSlides={visibleSlides}
    className={className}
  >
    <Slider>{children}</Slider>
    {showNavigation && (
      <>
        <ButtonBack>{goBack}</ButtonBack>
        <ButtonNext>{goNext}</ButtonNext>
      </>
    )}
  </CarouselProvider>
);

export default SliderCarousel;
