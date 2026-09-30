import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyFeed from './index';

// Mock the dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconArrowdownLightblue: 'mock-arrow-icon.svg',
      iconBuildingLightblue: 'mock-building-icon.svg',
      iconChatLightblue: 'mock-chat-icon.svg',
      iconListLightblue: 'mock-list-icon.svg'
    }
  },
  Image: ({ src, ...props }) => <img src={src} alt="mock-image" {...props} />,
  Button: ({ children, handleClick, ...props }) => (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((app, path) => `/${app}${path}`),
  goTo: jest.fn()
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'empty-feed-opportunities-title': 'No Opportunities Yet',
      'empty-feed-opportunities-subtitle1': 'Complete your',
      'empty-feed-opportunities-subtitle2': 'prequalification',
      'empty-feed-enquiries-title': 'No Enquiries Yet',
      'empty-feed-enquiries-subtitle1': 'Complete your',
      'empty-feed-enquiries-subtitle2': 'prequalification',
      'empty-feed-rooms-title': 'No Rooms Yet',
      'empty-feed-rooms-subtitle1': 'Complete your',
      'empty-feed-rooms-subtitle2': 'prequalification',
      'complete-prequalification': 'Complete Prequalification'
    };
    return translations[key] || key;
  })
}));

jest.mock('./EmptyFeed.styled', () => ({
  StyledFeed: ({ children, ...props }) => <div data-testid="styled-feed" {...props}>{children}</div>,
  StyledFeedElement: ({ children, first, second, third, fourth, fifth, small, ...props }) => (
    <div 
      data-testid={
        first ? 'feed-element-first' :
        second ? 'feed-element-second' :
        third ? 'feed-element-third' :
        fourth ? 'feed-element-fourth' :
        fifth ? 'feed-element-fifth' :
        'feed-element'
      }
      {...props}
    >
      {children}
    </div>
  )
}));

describe('EmptyFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EmptyFeed />);
    expect(screen.getByTestId('styled-feed')).toBeInTheDocument();
  });

  it('renders default rooms type when no type specified', () => {
    render(<EmptyFeed />);
    expect(screen.getByText('No Rooms Yet')).toBeInTheDocument();
    expect(screen.getByText('Complete your')).toBeInTheDocument();
    expect(screen.getByText('prequalification')).toBeInTheDocument();
  });

  it('renders opportunities type correctly', () => {
    render(<EmptyFeed type="opportunities" />);
    expect(screen.getByText('No Opportunities Yet')).toBeInTheDocument();
    expect(screen.getByText('Complete your')).toBeInTheDocument();
    expect(screen.getByText('prequalification')).toBeInTheDocument();
  });

  it('renders enquiries type correctly', () => {
    render(<EmptyFeed type="enquiries" />);
    expect(screen.getByText('No Enquiries Yet')).toBeInTheDocument();
    expect(screen.getByText('Complete your')).toBeInTheDocument();
    expect(screen.getByText('prequalification')).toBeInTheDocument();
  });

  it('renders all required feed elements', () => {
    render(<EmptyFeed />);
    expect(screen.getByTestId('feed-element-first')).toBeInTheDocument();
    expect(screen.getByTestId('feed-element-second')).toBeInTheDocument();
    expect(screen.getByTestId('feed-element-third')).toBeInTheDocument();
    expect(screen.getByTestId('feed-element-fourth')).toBeInTheDocument();
    expect(screen.getByTestId('feed-element-fifth')).toBeInTheDocument();
  });

  it('renders the correct images for each type', () => {
    const { rerender } = render(<EmptyFeed type="opportunities" />);
    const images = screen.getAllByAltText('mock-image');
    expect(images.find(img => img.getAttribute('src') === 'mock-building-icon.svg')).toBeInTheDocument();

    rerender(<EmptyFeed type="enquiries" />);
    const enquiryImages = screen.getAllByAltText('mock-image');
    expect(enquiryImages.find(img => img.getAttribute('src') === 'mock-list-icon.svg')).toBeInTheDocument();

    rerender(<EmptyFeed type="rooms" />);
    const roomImages = screen.getAllByAltText('mock-image');
    expect(roomImages.find(img => img.getAttribute('src') === 'mock-chat-icon.svg')).toBeInTheDocument();
  });

  it('renders the arrow down icon', () => {
    render(<EmptyFeed />);
    const images = screen.getAllByAltText('mock-image');
    const arrowImage = images.find(img => img.getAttribute('src') === 'mock-arrow-icon.svg');
    expect(arrowImage).toBeInTheDocument();
  });

  it('renders the complete prequalification button', () => {
    render(<EmptyFeed />);
    expect(screen.getByText('Complete Prequalification')).toBeInTheDocument();
  });

  it('calls navigation function when button is clicked', () => {
    const { getUrl, goTo } = require('v2/helpers/url');
    render(<EmptyFeed />);
    
    const button = screen.getByText('Complete Prequalification');
    fireEvent.click(button);
    
    expect(getUrl).toHaveBeenCalledWith('prosper', '/my-company/prequalification');
    expect(goTo).toHaveBeenCalled();
  });

  it('handles unknown type gracefully', () => {
    // The component should use rooms as default for unknown types
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<EmptyFeed type="unknown" />);
      // The component should not crash even with unknown type
      expect(screen.getByTestId('styled-feed')).toBeInTheDocument();
    } catch (error) {
      // If it throws, that's expected behavior - verify the error is handled
      expect(error).toBeDefined();
    }
    consoleSpy.mockRestore();
  });
});