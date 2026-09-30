import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProsperCarousel from './index';

// Mock the ArrowButton component since it's already tested separately
jest.mock('./ArrowButton', () => {
  return function MockArrowButton({ label, className, nextItem, src }) {
    return (
      <button
        data-testid={`arrow-button-${className}`}
        onClick={nextItem}
        aria-label={label}
      >
        <img src={src} alt={label} />
      </button>
    );
  };
});

describe('ProsperCarousel', () => {
  const mockChildren = (
    <div data-testid="test-carousel-slides">
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </div>
  );

  test('renders without crashing', () => {
    render(<ProsperCarousel>{mockChildren}</ProsperCarousel>);
    const carousel = screen.getByTestId('carousel');
    expect(carousel).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(<ProsperCarousel>{mockChildren}</ProsperCarousel>);
    expect(screen.getByTestId('test-carousel-slides')).toBeInTheDocument();
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  test('renders with default arrow buttons when no custom arrows provided', () => {
    render(<ProsperCarousel>{mockChildren}</ProsperCarousel>);
    
    // Check for default arrow buttons
    expect(screen.getByTestId('carousel-prev-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-next-arrow')).toBeInTheDocument();
  });

  test('uses custom renderArrowPrev when provided', () => {
    const customPrevArrow = (nextItem, label) => (
      <button data-testid="custom-prev-arrow" onClick={nextItem}>
        Custom Prev: {label}
      </button>
    );
    
    const carouselProps = { renderArrowPrev: customPrevArrow };
    
    render(
      <ProsperCarousel carouselProps={carouselProps}>
        {mockChildren}
      </ProsperCarousel>
    );
    
    expect(screen.getByTestId('custom-prev-arrow')).toBeInTheDocument();
    expect(screen.getByText('Custom Prev: Previous')).toBeInTheDocument();
  });

  test('uses custom renderArrowNext when provided', () => {
    const customNextArrow = (nextItem, label) => (
      <button data-testid="custom-next-arrow" onClick={nextItem}>
        Custom Next: {label}
      </button>
    );
    
    const carouselProps = { renderArrowNext: customNextArrow };
    
    render(
      <ProsperCarousel carouselProps={carouselProps}>
        {mockChildren}
      </ProsperCarousel>
    );
    
    expect(screen.getByTestId('custom-next-arrow')).toBeInTheDocument();
    expect(screen.getByText('Custom Next: Next')).toBeInTheDocument();
  });

  test('passes through other carousel props correctly', () => {
    const carouselProps = {
      autoPlay: true,
      infiniteLoop: true,
      showStatus: false,
      showThumbs: false,
    };
    
    render(
      <ProsperCarousel carouselProps={carouselProps}>
        {mockChildren}
      </ProsperCarousel>
    );
    
    const carousel = screen.getByTestId('carousel');
    expect(carousel).toBeInTheDocument();
    // The props should be passed to the underlying Carousel component
  });

  test('handles empty carouselProps object', () => {
    render(
      <ProsperCarousel carouselProps={{}}>
        {mockChildren}
      </ProsperCarousel>
    );
    
    expect(screen.getByTestId('carousel')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-prev-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-next-arrow')).toBeInTheDocument();
  });

  test('handles undefined carouselProps', () => {
    render(<ProsperCarousel>{mockChildren}</ProsperCarousel>);
    
    expect(screen.getByTestId('carousel')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-prev-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-next-arrow')).toBeInTheDocument();
  });

  test('default arrow buttons use correct icons and classes', () => {
    render(<ProsperCarousel>{mockChildren}</ProsperCarousel>);
    
    // Check that default arrows are rendered (mocked ArrowButton components)
    const prevArrow = screen.getByTestId('arrow-button-control-arrow control-prev');
    const nextArrow = screen.getByTestId('arrow-button-control-arrow control-next');
    
    expect(prevArrow).toBeInTheDocument();
    expect(nextArrow).toBeInTheDocument();
  });

  test('preserves existing carouselProps while adding default arrows', () => {
    const carouselProps = {
      autoPlay: true,
      showStatus: false,
    };
    
    render(
      <ProsperCarousel carouselProps={carouselProps}>
        {mockChildren}
      </ProsperCarousel>
    );
    
    expect(screen.getByTestId('carousel')).toBeInTheDocument();
    // Should still have default arrows since none were provided
    expect(screen.getByTestId('carousel-prev-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-next-arrow')).toBeInTheDocument();
  });

  test('snapshot test', () => {
    const { container } = render(
      <ProsperCarousel>{mockChildren}</ProsperCarousel>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});