import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResourcesSlide from './ResourcesSlide';

// Mock dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      tenderReturnTemplate: 'mock-template-image.jpg'
    }
  },
  Button: ({ children, handleClick, ...props }) => (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => {
      const translations = {
        'view-all-resources': 'View All Resources'
      };
      return translations[key] || key;
    })
  })
}));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((site, path) => `${site}/${path}`),
  goToNewTab: jest.fn()
}));

jest.mock('./Dashboard.styled', () => ({
  ResourceContent: ({ children, src, ...props }) => (
    <div data-testid="resource-content" data-src={src} {...props}>
      {children}
    </div>
  ),
  ButtonWrapper: ({ children, resources, ...props }) => (
    <div data-testid="button-wrapper" data-resources={resources} {...props}>
      {children}
    </div>
  )
}));

describe('ResourcesSlide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ResourcesSlide />);
    expect(screen.getByTestId('resource-content')).toBeInTheDocument();
  });

  it('renders with correct background image', () => {
    render(<ResourcesSlide />);
    const resourceContent = screen.getByTestId('resource-content');
    expect(resourceContent).toHaveAttribute('data-src', 'mock-template-image.jpg');
  });

  it('renders the button wrapper with resources prop', () => {
    render(<ResourcesSlide />);
    const buttonWrapper = screen.getByTestId('button-wrapper');
    expect(buttonWrapper).toHaveAttribute('data-resources', 'true');
  });

  it('renders the view all resources button', () => {
    render(<ResourcesSlide />);
    expect(screen.getByText('View All Resources')).toBeInTheDocument();
  });

  it('calls navigation function when button is clicked', () => {
    const { getUrl, goToNewTab } = require('v2/helpers/url');
    render(<ResourcesSlide />);
    
    const button = screen.getByText('View All Resources');
    fireEvent.click(button);
    
    expect(getUrl).toHaveBeenCalledWith('SITE_PROSPER', 'resources');
    expect(goToNewTab).toHaveBeenCalled();
  });

  it('renders with correct button color', () => {
    render(<ResourcesSlide />);
    const button = screen.getByText('View All Resources');
    expect(button).toHaveAttribute('color', 'prosperGreenButton');
  });
});