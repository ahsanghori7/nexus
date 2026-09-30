import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Content from './Content';

// Mock the external dependencies
jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((app, path) => `${app}${path}`),
  goToNewTab: jest.fn(),
}));

jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn(),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
        black: '#000000',
      },
      prosper: {
        laceVeil: '#f5f5f5',
      },
    },
  },
  Image: ({ src, alt }) => <img src={src} alt={alt || 'test-image'} />,
}));

jest.mock('./ImageContainer', () => ({ children, onClick, extra }) => (
  <div 
    data-testid="image-container"
    onClick={onClick}
    style={extra}
  >
    {children}
  </div>
));

describe('Content', () => {
  const defaultProps = {
    aid: '123',
    idDoc: 456,
    icon: 'test-icon.png',
    iconLabel: 'Test Icon',
    date: '2023-01-01',
    title: 'Test Document Title',
    document: 'test-document.pdf',
    fileName: 'test-file.pdf',
    extra: {},
    type: 'document',
    contextType: 'prosper'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Content {...defaultProps} />);
    expect(screen.getByTestId('image-container')).toBeInTheDocument();
  });

  it('renders the icon image', () => {
    render(<Content {...defaultProps} />);
    const image = screen.getByAltText('test-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'test-icon.png');
  });

  it('renders the icon label when provided', () => {
    render(<Content {...defaultProps} />);
    expect(screen.getByText('Test Icon')).toBeInTheDocument();
  });

  it('does not render icon label when not provided', () => {
    const propsWithoutLabel = { ...defaultProps, iconLabel: '' };
    render(<Content {...propsWithoutLabel} />);
    expect(screen.queryByText('Test Icon')).not.toBeInTheDocument();
  });

  it('renders the title when contextType is not clink', () => {
    render(<Content {...defaultProps} />);
    expect(screen.getByText('Test Document Title')).toBeInTheDocument();
  });

  it('does not render title when contextType is clink', () => {
    const clinkProps = { ...defaultProps, contextType: 'clink' };
    render(<Content {...clinkProps} />);
    expect(screen.queryByText('Test Document Title')).not.toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <Content {...defaultProps}>
        <div>Test Child Content</div>
      </Content>
    );
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('displays tooltip with fileName', () => {
    render(<Content {...defaultProps} />);
    const tooltipElement = screen.getByTestId('mui-tooltip');
    expect(tooltipElement).toHaveAttribute('data-title', 'test-file.pdf');
  });

  it('handles click on ImageContainer when document exists', () => {
    const { goToNewTab, getUrl } = require('v2/helpers/url');
    
    render(<Content {...defaultProps} />);
    
    const imageContainer = screen.getByTestId('image-container');
    fireEvent.click(imageContainer);
    
    expect(getUrl).toHaveBeenCalledWith(
      'APP_PROSPER',
      '/relay/v1/prequalification/123/download/456'
    );
    expect(goToNewTab).toHaveBeenCalled();
  });

  it('does not call goToNewTab when document is empty', () => {
    const { goToNewTab } = require('v2/helpers/url');
    const propsWithoutDoc = { ...defaultProps, document: '' };
    
    render(<Content {...propsWithoutDoc} />);
    
    const imageContainer = screen.getByTestId('image-container');
    fireEvent.click(imageContainer);
    
    expect(goToNewTab).not.toHaveBeenCalled();
  });

  it('applies correct styles based on expiredDate', () => {
    const { expiredDate } = require('v2/helpers/date');
    expiredDate.mockReturnValue(false); // Not expired
    
    render(<Content {...defaultProps} />);
    
    const imageContainer = screen.getByTestId('image-container');
    expect(imageContainer).toHaveStyle('background-color: #f5f5f5'); // laceVeil color
  });

  it('applies white background when date is expired', () => {
    const { expiredDate } = require('v2/helpers/date');
    expiredDate.mockReturnValue(true); // Expired
    
    render(<Content {...defaultProps} />);
    
    const imageContainer = screen.getByTestId('image-container');
    expect(imageContainer).toHaveStyle('background-color: #ffffff'); // white color
  });

  it('merges extra styles correctly', () => {
    const extraProps = {
      ...defaultProps,
      extra: { 
        borderRadius: '8px',
        padding: '10px'
      }
    };
    
    render(<Content {...extraProps} />);
    
    const imageContainer = screen.getByTestId('image-container');
    expect(imageContainer).toHaveStyle('border-radius: 8px');
    expect(imageContainer).toHaveStyle('padding: 10px');
  });

  it('handles default prop values', () => {
    const minimalProps = { aid: '123' };
    
    render(<Content {...minimalProps} />);
    
    // Should not crash and should render basic structure
    expect(screen.getByTestId('image-container')).toBeInTheDocument();
  });
});
