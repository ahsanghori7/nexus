import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeaderLogo from './HeaderLogo';

// Mock styled-components
jest.mock('styled-components', () => {
  const React = require('react');
  
  // Create a mock component that handles both template literals and withConfig
  const createStyledComponent = (tag) => {
    const StyledComponent = React.forwardRef((props, ref) =>
      React.createElement(tag, { ...props, ref })
    );
    
    // Mock the template literal call
    const styledTag = (strings, ...args) => {
      StyledComponent.displayName = `Styled(${tag})`;
      StyledComponent.withConfig = () => StyledComponent;
      return StyledComponent;
    };
    
    styledTag.withConfig = () => styledTag;
    
    return styledTag;
  };
  
  const styled = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return createStyledComponent(prop);
        }
        return undefined;
      },
    }
  );
  
  return {
    __esModule: true,
    default: styled,
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      prosperImage: 'test-prosper-image.png',
    },
    dimensions: {
      SM_SCREEN: 768,
    },
    colors: {
      general: {
        white: '#ffffff',
      },
    },
  },
  HOOKS: {
    useWindowDimensions: jest.fn(),
  },
  Image: ({ height, width, src }) => (
    <img data-testid="image" height={height} width={width} src={src} alt="" />
  ),
}));

// Mock BASE_URLS global
global.BASE_URLS = {
  PROSPER: 'https://prosper.example.com',
};

const mockUseWindowDimensions = require('clink-components').HOOKS.useWindowDimensions;

describe('HeaderLogo', () => {
  const defaultProps = {
    subscriptionId: 'test-subscription',
    filterRoutes: ['test-subscription'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with correct structure', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1024 });
    
    render(<HeaderLogo {...defaultProps} />);
    
    const image = screen.getByTestId('image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'test-prosper-image.png');
    expect(image).toHaveAttribute('height', '28');
    expect(image).toHaveAttribute('width', '20');
  });

  it('should use smaller dimensions on small screens', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 500 });
    
    render(<HeaderLogo {...defaultProps} />);
    
    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('height', '27');
    expect(image).toHaveAttribute('width', '19');
  });

  it('should use larger dimensions on large screens', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<HeaderLogo {...defaultProps} />);
    
    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('height', '28');
    expect(image).toHaveAttribute('width', '20');
  });

  it('should render link to enquiries when subscription is in filter routes', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1024 });
    
    render(<HeaderLogo {...defaultProps} />);
    
    const link = screen.getByLabelText('header-logo');
    expect(link).toHaveAttribute('href', 'https://prosper.example.com/projects/enquiries');
  });

  it('should render link to dashboard when subscription is not in filter routes', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1024 });
    
    const props = {
      subscriptionId: 'other-subscription',
      filterRoutes: ['test-subscription'],
    };
    
    render(<HeaderLogo {...props} />);
    
    const link = screen.getByLabelText('header-logo');
    expect(link).toHaveAttribute('href', 'https://prosper.example.com/dashboard');
  });

  it('should render link to dashboard when filter routes is empty', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1024 });
    
    const props = {
      subscriptionId: 'test-subscription',
      filterRoutes: [],
    };
    
    render(<HeaderLogo {...props} />);
    
    const link = screen.getByLabelText('header-logo');
    expect(link).toHaveAttribute('href', 'https://prosper.example.com/dashboard');
  });

  it('should handle dimensions exactly at SM_SCREEN breakpoint', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 768 });
    
    render(<HeaderLogo {...defaultProps} />);
    
    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('height', '27');
    expect(image).toHaveAttribute('width', '19');
  });

  it('should handle dimensions just above SM_SCREEN breakpoint', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 769 });
    
    render(<HeaderLogo {...defaultProps} />);
    
    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('height', '28');
    expect(image).toHaveAttribute('width', '20');
  });
});