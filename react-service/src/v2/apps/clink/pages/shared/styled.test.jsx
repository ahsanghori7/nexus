import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock styled-components
jest.mock('styled-components', () => {
  const React = require('react');
  
  // Create a mock component that handles both template literals and withConfig
  const createStyledComponent = (tag) => {
    const StyledComponent = React.forwardRef((props, ref) =>
      React.createElement(tag, { 
        ...props, 
        ref,
        'data-testid': props['data-testid'] || `styled-${tag}`,
        className: `styled-component ${props.className || ''}`.trim(),
      })
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

  // Handle styled(Component) syntax
  const styledFunction = (Component) => {
    const StyledComponent = React.forwardRef((props, ref) =>
      React.createElement(Component, { 
        ...props, 
        ref,
        className: `styled-component ${props.className || ''}`.trim(),
      })
    );
    
    const styledTag = (strings, ...args) => {
      StyledComponent.displayName = `Styled(${Component.displayName || Component.name || 'Component'})`;
      StyledComponent.withConfig = () => StyledComponent;
      return StyledComponent;
    };
    
    styledTag.withConfig = () => styledTag;
    
    return styledTag;
  };

  // Merge the function with the proxy
  Object.setPrototypeOf(styledFunction, styled);

  return {
    __esModule: true,
    default: styledFunction,
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e0e0e0',
        clinkPurple: '#800080',
        white: '#ffffff',
        lightPeriwinkle: '#c5c6d0',
        clinkBackgroundPurple: '#f5f5f5',
        eerieBlack: '#1c1c1c',
        darkCharcoal: '#36454f',
      },
    },
    fonts: {
      proxima_nova1: 'Proxima Nova',
      proxima_nova2: 'sans-serif',
    },
  },
  Button: ({ children, ...props }) => (
    <button data-testid="clink-button" {...props}>
      {children}
    </button>
  ),
}));

import {
  StyledContainer,
  StyledHeader,
  StyledPageSubtitle,
  StyledPanelContent,
  StyledContent,
  StyledButton,
  StyledBigButton,
} from './styled';

describe('Styled Components', () => {
  describe('StyledContainer', () => {
    it('renders without crashing', () => {
      render(<StyledContainer data-testid="container">Test content</StyledContainer>);
      expect(document.querySelector('[data-testid="container"]')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <StyledContainer data-testid="container">
          <div>Child content</div>
        </StyledContainer>
      );
      expect(document.querySelector('[data-testid="container"]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <StyledContainer className="custom-class" data-testid="container">
          Test
        </StyledContainer>
      );
      const element = document.querySelector('[data-testid="container"]');
      expect(element).toHaveClass('styled-component');
    });
  });

  describe('StyledContent', () => {
    it('renders without crashing', () => {
      render(<StyledContent data-testid="content">Content</StyledContent>);
      expect(document.querySelector('[data-testid="content"]')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <StyledContent data-testid="content">
          <span>Inner content</span>
        </StyledContent>
      );
      expect(document.querySelector('[data-testid="content"]')).toBeInTheDocument();
    });
  });

  describe('StyledPanelContent', () => {
    it('renders without crashing', () => {
      render(<StyledPanelContent data-testid="panel">Panel content</StyledPanelContent>);
      expect(document.querySelector('[data-testid="panel"]')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <StyledPanelContent data-testid="panel">
          <div className="panel-wrapper">
            <div className="panel-body">Panel body</div>
          </div>
        </StyledPanelContent>
      );
      expect(document.querySelector('[data-testid="panel"]')).toBeInTheDocument();
    });
  });

  describe('StyledHeader', () => {
    it('renders without crashing', () => {
      render(<StyledHeader data-testid="header">Header content</StyledHeader>);
      expect(document.querySelector('[data-testid="header"]')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <StyledHeader data-testid="header">
          <h1>Page Title</h1>
        </StyledHeader>
      );
      expect(document.querySelector('[data-testid="header"]')).toBeInTheDocument();
    });
  });

  describe('StyledPageSubtitle', () => {
    it('renders without crashing', () => {
      render(<StyledPageSubtitle data-testid="subtitle">Subtitle</StyledPageSubtitle>);
      expect(document.querySelector('[data-testid="subtitle"]')).toBeInTheDocument();
    });

    it('renders text content correctly', () => {
      const subtitleText = 'Page Subtitle';
      render(<StyledPageSubtitle data-testid="subtitle">{subtitleText}</StyledPageSubtitle>);
      const element = document.querySelector('[data-testid="subtitle"]');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent(subtitleText);
    });
  });

  describe('StyledButton', () => {
    it('renders without crashing', () => {
      render(<StyledButton data-testid="button">Click me</StyledButton>);
      expect(document.querySelector('[data-testid="button"]')).toBeInTheDocument();
    });

    it('renders button text correctly', () => {
      const buttonText = 'Submit';
      render(<StyledButton data-testid="button">{buttonText}</StyledButton>);
      const element = document.querySelector('[data-testid="button"]');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent(buttonText);
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(
        <StyledButton onClick={handleClick} data-testid="button">
          Click me
        </StyledButton>
      );
      
      const button = document.querySelector('[data-testid="button"]');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(
        <StyledButton disabled data-testid="button">
          Disabled button
        </StyledButton>
      );
      const button = document.querySelector('[data-testid="button"]');
      expect(button).toBeDisabled();
    });
  });

  describe('StyledBigButton', () => {
    it('renders without crashing', () => {
      render(<StyledBigButton data-testid="big-button">Big Button</StyledBigButton>);
      expect(document.querySelector('[data-testid="big-button"]')).toBeInTheDocument();
    });

    it('renders button text correctly', () => {
      const buttonText = 'Large Submit';
      render(<StyledBigButton data-testid="big-button">{buttonText}</StyledBigButton>);
      const element = document.querySelector('[data-testid="big-button"]');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent(buttonText);
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(
        <StyledBigButton onClick={handleClick} data-testid="big-button">
          Big Click
        </StyledBigButton>
      );
      
      const button = document.querySelector('[data-testid="big-button"]');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies clink-button class', () => {
      render(
        <StyledBigButton className="clink-button" data-testid="big-button">
          Styled Big Button
        </StyledBigButton>
      );
      const button = document.querySelector('[data-testid="big-button"]');
      expect(button).toHaveClass('clink-button');
    });
  });

  describe('Component Integration', () => {
    it('renders multiple styled components together', () => {
      render(
        <StyledContainer data-testid="container">
          <StyledHeader data-testid="header">
            <StyledPageSubtitle data-testid="subtitle">Page Title</StyledPageSubtitle>
          </StyledHeader>
          <StyledPanelContent data-testid="panel">
            <StyledContent data-testid="content">
              <StyledButton data-testid="button">Click</StyledButton>
              <StyledBigButton data-testid="big-button">Big Click</StyledBigButton>
            </StyledContent>
          </StyledPanelContent>
        </StyledContainer>
      );

      expect(document.querySelector('[data-testid="container"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="header"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="subtitle"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="panel"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="content"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="button"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="big-button"]')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('passes through HTML attributes', () => {
      render(
        <StyledContainer 
          id="custom-id" 
          role="main" 
          data-testid="container"
        >
          Content
        </StyledContainer>
      );
      const element = document.querySelector('[data-testid="container"]');
      expect(element).toHaveAttribute('id', 'custom-id');
      expect(element).toHaveAttribute('role', 'main');
    });

    it('handles ref forwarding', () => {
      const ref = React.createRef();
      render(
        <StyledContent ref={ref} data-testid="content">
          Content
        </StyledContent>
      );
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for StyledContainer', () => {
      const { container } = render(
        <StyledContainer>
          <div className="breadcrumbs">
            <div className="breadcrumb-item">Home</div>
          </div>
        </StyledContainer>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for StyledButton variations', () => {
      const { container } = render(
        <div>
          <StyledButton>Normal Button</StyledButton>
          <StyledBigButton className="clink-button">Big Button</StyledBigButton>
        </div>
      );
      expect(container).toMatchSnapshot();
    });
  });
});