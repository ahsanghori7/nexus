import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThankYouReference from './ThankYouReference';

// Mock the PHPGlobals helper
jest.mock('v2/helpers/php-globals', () => {
  return jest.fn(() => ({
    data: {
      subcontractor_name: 'Test Subcontractor Ltd'
    }
  }));
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'reference-thank-you-1': 'Thank you for approving the work reference for ',
        'reference-thank-you-2': '.',
        'what-is-clink': 'What is C-Link?',
        'clink-reference-description': 'C-Link is a construction management platform.',
        'clink-reference-tour-1': 'Would you like to take a ',
        'clink-reference-tour-2': 'tour',
        'clink-reference-tour-3': ' of our platform?',
        'complete-your-profile': 'Complete your profile'
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}));

// Mock Container component
jest.mock('v2/apps/prosper/pages/sign-up/shared/Container', () => {
  return function Container({ children, linkList, footer, name }) {
    return (
      <div data-testid="mock-container" data-footer={footer} data-name={name}>
        {linkList && (
          <div data-testid="link-list">
            {linkList.map((link, index) => (
              <a key={index} href={link.props.to}>
                {link.linkCopy}
              </a>
            ))}
          </div>
        )}
        {children}
      </div>
    );
  };
});

describe('ThankYouReference', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ThankYouReference />);
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
  });

  test('displays thank you message with subcontractor name', () => {
    render(<ThankYouReference />);
    
    // Look for the complete message content
    expect(screen.getByText((content, element) => {
      return content.includes('Thank you for approving the work reference for') && 
             content.includes('Test Subcontractor Ltd');
    })).toBeInTheDocument();
  });

  test('displays what is C-Link heading', () => {
    render(<ThankYouReference />);
    
    expect(screen.getByText('What is C-Link?')).toBeInTheDocument();
  });

  test('displays C-Link description', () => {
    render(<ThankYouReference />);
    
    expect(screen.getByText('C-Link is a construction management platform.')).toBeInTheDocument();
  });

  test('displays tour link with correct href', () => {
    render(<ThankYouReference />);
    
    expect(screen.getByText(/Would you like to take a/)).toBeInTheDocument();
    expect(screen.getByText('tour')).toBeInTheDocument();
    expect(screen.getByText(/of our platform/)).toBeInTheDocument();
    
    const tourLink = screen.getByRole('link', { name: 'tour' });
    expect(tourLink).toHaveAttribute('href', 'https://c-link.com/book-demo/');
  });

  test('renders with correct Container props', () => {
    render(<ThankYouReference />);
    
    const container = screen.getByTestId('mock-container');
    expect(container).toHaveAttribute('data-footer', 'false');
    expect(container).toHaveAttribute('data-name', 'false');
  });

  test('displays profile completion link in linkList', () => {
    render(<ThankYouReference />);
    
    const linkList = screen.getByTestId('link-list');
    expect(linkList).toBeInTheDocument();
    
    const profileLink = screen.getByRole('link', { name: 'Complete your profile' });
    expect(profileLink).toHaveAttribute('href', '/my-company');
  });

  test('handles missing subcontractor name gracefully', () => {
    // Mock PHPGlobals to return data without subcontractor_name
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue({
      data: {}
    });

    render(<ThankYouReference />);
    
    // Look for the complete message content with fallback
    expect(screen.getByText((content, element) => {
      return content.includes('Thank you for approving the work reference for') && 
             content.includes('subcontractor');
    })).toBeInTheDocument();
  });

  test('handles missing data object gracefully', () => {
    // Mock PHPGlobals to return null
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue(null);

    render(<ThankYouReference />);
    
    // Look for the complete message content with fallback
    expect(screen.getByText((content, element) => {
      return content.includes('Thank you for approving the work reference for') && 
             content.includes('subcontractor');
    })).toBeInTheDocument();
  });
});