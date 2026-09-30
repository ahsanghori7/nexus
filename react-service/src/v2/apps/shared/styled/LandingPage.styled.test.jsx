import React from 'react';
import { render } from '@testing-library/react';

// Import all styled components from the file
import * as StyledComponents from './LandingPage.styled';

// Mock the constants to avoid dependency issues
jest.mock('clink-components', () => ({
  CONSTANTS: {
    dimensions: {
      SM_SCREEN: 576,
      MD_SCREEN: 768,
      LG_SCREEN: 992,
      XL_SCREEN: 1200,
    },
    fonts: {
      avantGardeGothicPRO: 'Arial, sans-serif',
    },
    colors: {
      general: {
        japaneseIndigo: '#293462',
        white: '#FFFFFF',
        aliceBlue: '#F0F8FF',
        blueMagentaViolet: '#553C9A',
        christalle: '#0D1F3C',
      },
      prosper: {
        prosperBoxRed: '#E74C3C',
        bubbles: '#E7F4F7',
        mauve: '#E0ACD5',
        paleCerulean: '#B3E5FC',
        prosperBoxShadow2: '0 2px 4px rgba(0,0,0,0.1)',
        prosperRedBorder: '#E74C3C',
      },
    },
  },
}));

describe('LandingPage Styled Components', () => {
  test('should export styled components', () => {
    // Test that the module exports styled components
    const componentKeys = Object.keys(StyledComponents);
    expect(componentKeys.length).toBeGreaterThan(0);
  });

  test('should render StyledWrapper without crashing', () => {
    const { container } = render(
      <StyledComponents.StyledWrapper data-testid="styled-wrapper">
        <div>Test content</div>
      </StyledComponents.StyledWrapper>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  test('StyledWrapper should have CSS class', () => {
    const { getByTestId } = render(
      <StyledComponents.StyledWrapper data-testid="styled-wrapper">
        <div>Test content</div>
      </StyledComponents.StyledWrapper>
    );
    
    const wrapper = getByTestId('styled-wrapper');
    expect(wrapper.className).toBeTruthy();
  });

  test('should render children correctly', () => {
    const testContent = 'Test content for landing page wrapper';
    const { getByText } = render(
      <StyledComponents.StyledWrapper>
        <div>{testContent}</div>
      </StyledComponents.StyledWrapper>
    );
    
    expect(getByText(testContent)).toBeInTheDocument();
  });

  test('should render StyledWrapper component', () => {
    const { getByTestId } = render(
      <StyledComponents.StyledWrapper data-testid="styled-wrapper-component">
        <div>Wrapper content</div>
      </StyledComponents.StyledWrapper>
    );
    
    expect(getByTestId('styled-wrapper-component')).toBeInTheDocument();
  });

  test('should render multiple children in StyledWrapper', () => {
    const { getByText } = render(
      <StyledComponents.StyledWrapper>
        <div>First child</div>
        <div>Second child</div>
      </StyledComponents.StyledWrapper>
    );
    
    expect(getByText('First child')).toBeInTheDocument();
    expect(getByText('Second child')).toBeInTheDocument();
  });

  test('should handle empty StyledWrapper', () => {
    const { container } = render(
      <StyledComponents.StyledWrapper />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  test('should render nested structure', () => {
    const { getByTestId } = render(
      <StyledComponents.StyledWrapper data-testid="wrapper">
        <StyledComponents.StyledWrapperLeft data-testid="wrapper-left">
          <div>Nested content</div>
        </StyledComponents.StyledWrapperLeft>
      </StyledComponents.StyledWrapper>
    );
    
    expect(getByTestId('wrapper')).toBeInTheDocument();
    expect(getByTestId('wrapper-left')).toBeInTheDocument();
  });

  test('should render with various component combinations', () => {
    const componentKeys = Object.keys(StyledComponents);
    
    // Check that we have some expected common styled component exports
    expect(componentKeys.length).toBeGreaterThan(0);
    
    // The exact component names will depend on what's exported from the file
    componentKeys.forEach(key => {
      const Component = StyledComponents[key];
      
      // Only test if it's actually a styled component (has styledComponentId)
      if (Component && typeof Component === 'object' && Component.styledComponentId) {
        const { container } = render(<Component>Test</Component>);
        expect(container.firstChild).toBeInTheDocument();
      }
    });
  });

  test('should handle styled components as functions', () => {
    // Test that styled components can be called as React components
    const { container } = render(
      React.createElement(StyledComponents.StyledWrapper, {}, 'Function call test')
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});