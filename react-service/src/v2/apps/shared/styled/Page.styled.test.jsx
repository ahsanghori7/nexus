import React from 'react';
import { render } from '@testing-library/react';

// Import the default export and named exports
import StyledContainer, * as StyledComponents from './Page.styled';

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
        prosperCursorGray: '#BDC3C7',
        prosperCursorGrayDark: '#7F8C8D',
      },
    },
  },
}));

describe('Page Styled Components', () => {
  test('should render StyledContainer without crashing', () => {
    const { container } = render(
      <StyledContainer data-testid="styled-container">
        <div>Test content</div>
      </StyledContainer>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  test('StyledContainer should have CSS class', () => {
    const { getByTestId } = render(
      <StyledContainer data-testid="styled-container">
        <div>Test content</div>
      </StyledContainer>
    );
    
    const container = getByTestId('styled-container');
    expect(container.className).toBeTruthy();
  });

  test('StyledContainer should render with props', () => {
    const { getByTestId } = render(
      <StyledContainer 
        data-testid="styled-container"
        winners={true}
        page={true}
      >
        <div>Test content</div>
      </StyledContainer>
    );
    
    const container = getByTestId('styled-container');
    expect(container).toBeInTheDocument();
  });

  test('should render children correctly', () => {
    const testContent = 'Test content for styled container';
    const { getByText } = render(
      <StyledContainer>
        <div>{testContent}</div>
      </StyledContainer>
    );
    
    expect(getByText(testContent)).toBeInTheDocument();
  });

  test('should export styled components', () => {
    // Test that the module exports styled components
    expect(typeof StyledContainer).toBe('object');
    expect(StyledContainer.styledComponentId).toBeDefined();
  });

  test('should handle different prop combinations', () => {
    // Test with winners=true, page=false
    const { getByTestId: getByTestId1 } = render(
      <StyledContainer 
        data-testid="styled-container-1"
        winners={true}
        page={false}
      >
        <div>Test content 1</div>
      </StyledContainer>
    );
    
    expect(getByTestId1('styled-container-1')).toBeInTheDocument();

    // Test with winners=false, page=true
    const { getByTestId: getByTestId2 } = render(
      <StyledContainer 
        data-testid="styled-container-2"
        winners={false}
        page={true}
      >
        <div>Test content 2</div>
      </StyledContainer>
    );
    
    expect(getByTestId2('styled-container-2')).toBeInTheDocument();
  });

  test('should render multiple styled components if available', () => {
    // Test that we can access the styled components object
    const componentKeys = Object.keys(StyledComponents);
    expect(componentKeys.length).toBeGreaterThan(0);
    
    // Test some of the named exports
    expect(componentKeys).toContain('Slide');
    expect(componentKeys).toContain('Winners');
    expect(componentKeys).toContain('StyledText');
  });

  test('should render other styled components', () => {
    // Test Slide component
    const { getByTestId } = render(
      <StyledComponents.Slide data-testid="slide">
        <div>Slide content</div>
      </StyledComponents.Slide>
    );
    
    expect(getByTestId('slide')).toBeInTheDocument();
  });

  test('should render StyledText component', () => {
    const { getByTestId } = render(
      <StyledComponents.StyledText data-testid="styled-text">
        Test text content
      </StyledComponents.StyledText>
    );
    
    expect(getByTestId('styled-text')).toBeInTheDocument();
  });

  test('should render StyledParagraph component', () => {
    const { getByTestId } = render(
      <StyledComponents.StyledParagraph data-testid="styled-paragraph">
        Test paragraph content
      </StyledComponents.StyledParagraph>
    );
    
    expect(getByTestId('styled-paragraph')).toBeInTheDocument();
  });
});