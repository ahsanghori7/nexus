import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledRegisteredWrapper } from './styled';

// Mock theme for styled-components testing
const mockTheme = {};

describe('StyledRegisteredWrapper', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledRegisteredWrapper>
          <div>Test content</div>
        </StyledRegisteredWrapper>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with v1 version styling', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledRegisteredWrapper version="v1">
          <div>Test content</div>
        </StyledRegisteredWrapper>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle('display: flex');
    expect(container.firstChild).toHaveStyle('flex-wrap: wrap');
    expect(container.firstChild).toHaveStyle('padding-top: 22px');
    expect(container.firstChild).toHaveStyle('justify-content: start');
  });

  it('renders with v2 version styling', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledRegisteredWrapper version="v2">
          <div>Test content</div>
        </StyledRegisteredWrapper>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle('display: flex');
    expect(container.firstChild).toHaveStyle('flex-wrap: wrap');
    expect(container.firstChild).toHaveStyle('padding-top: 22px');
    expect(container.firstChild).toHaveStyle('justify-content: start');
  });

  it('renders children correctly', () => {
    const testContent = 'Test child content';
    const { getByText } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledRegisteredWrapper>
          <div>{testContent}</div>
        </StyledRegisteredWrapper>
      </ThemeProvider>
    );
    
    expect(getByText(testContent)).toBeInTheDocument();
  });

  it('matches snapshot for v1', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledRegisteredWrapper version="v1">
          <div className="card__item">
            <div className="card__item--title">Test Title</div>
            <div className="card__item--body">Test Body</div>
          </div>
        </StyledRegisteredWrapper>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for v2', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledRegisteredWrapper version="v2">
          <div className="card__item">
            <div className="card__item--title">Test Title</div>
            <div className="card__item--body">Test Body</div>
          </div>
        </StyledRegisteredWrapper>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});