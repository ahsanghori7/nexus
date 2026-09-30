import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScrollToTop from './ScrollToTop';

// Mock window.scrollTo
const mockScrollTo = jest.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true,
});

describe('ScrollToTop', () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up event listeners
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ScrollToTop />);
    // Button should not be visible initially (scroll position is 0)
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows button when scrolled down more than 100px', () => {
    render(<ScrollToTop />);
    
    // Simulate scrolling down
    Object.defineProperty(window, 'scrollY', {
      value: 150,
      writable: true,
    });
    
    fireEvent.scroll(window);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('hides button when scrolled less than 100px', () => {
    render(<ScrollToTop />);
    
    // First scroll down to make it visible
    Object.defineProperty(window, 'scrollY', {
      value: 150,
      writable: true,
    });
    fireEvent.scroll(window);
    
    // Then scroll back up
    Object.defineProperty(window, 'scrollY', {
      value: 50,
      writable: true,
    });
    fireEvent.scroll(window);
    
    // Button should be hidden again
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('scrolls to top when button is clicked', () => {
    render(<ScrollToTop />);
    
    // Make button visible by scrolling
    Object.defineProperty(window, 'scrollY', {
      value: 150,
      writable: true,
    });
    fireEvent.scroll(window);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });

  it('adds and removes scroll event listener', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<ScrollToTop />);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('has correct button properties', () => {
    render(<ScrollToTop />);
    
    // Make button visible first
    Object.defineProperty(window, 'scrollY', {
      value: 150,
      writable: true,
    });
    fireEvent.scroll(window);
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('id', 'scroll-to-top');
    expect(button).toHaveClass('MuiButton-containedPrimary');
  });
});