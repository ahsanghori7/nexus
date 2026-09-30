import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import {
  StyledPageTitle,
  StyledProjectsContainer,
  StyledPageSubtitle,
  StyledDropdownContent,
  StyledProjectsContentDesktop,
} from './styled';

// Mock styled-components theme (if needed)
const mockTheme = {};

// Helper function to render styled components with theme provider
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('Project Dashboard Styled Components', () => {
  describe('StyledPageTitle', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledPageTitle>Test Title</StyledPageTitle>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render text content correctly', () => {
      const titleText = 'Project Dashboard';
      const { getByText } = renderWithTheme(
        <StyledPageTitle>{titleText}</StyledPageTitle>
      );
      expect(getByText(titleText)).toBeInTheDocument();
    });

    it('should be an h1 element', () => {
      const { container } = renderWithTheme(
        <StyledPageTitle>Test Title</StyledPageTitle>
      );
      expect(container.firstChild.tagName).toBe('H1');
    });
  });

  describe('StyledPageSubtitle', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledPageSubtitle>Test Subtitle</StyledPageSubtitle>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render text content correctly', () => {
      const subtitleText = 'Project Overview';
      const { getByText } = renderWithTheme(
        <StyledPageSubtitle>{subtitleText}</StyledPageSubtitle>
      );
      expect(getByText(subtitleText)).toBeInTheDocument();
    });

    it('should be an h2 element', () => {
      const { container } = renderWithTheme(
        <StyledPageSubtitle>Test Subtitle</StyledPageSubtitle>
      );
      expect(container.firstChild.tagName).toBe('H2');
    });
  });

  describe('StyledProjectsContainer', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledProjectsContainer>
          <div>Test Content</div>
        </StyledProjectsContainer>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      const testContent = 'Projects Container Content';
      const { getByText } = renderWithTheme(
        <StyledProjectsContainer>
          <div>{testContent}</div>
        </StyledProjectsContainer>
      );
      expect(getByText(testContent)).toBeInTheDocument();
    });

    it('should be a div element', () => {
      const { container } = renderWithTheme(
        <StyledProjectsContainer>Test</StyledProjectsContainer>
      );
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('StyledProjectsContentDesktop', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledProjectsContentDesktop>
          <div>Desktop Content</div>
        </StyledProjectsContentDesktop>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      const testContent = 'Desktop Projects Content';
      const { getByText } = renderWithTheme(
        <StyledProjectsContentDesktop>
          <div>{testContent}</div>
        </StyledProjectsContentDesktop>
      );
      expect(getByText(testContent)).toBeInTheDocument();
    });

    it('should be a div element', () => {
      const { container } = renderWithTheme(
        <StyledProjectsContentDesktop>Test</StyledProjectsContentDesktop>
      );
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('StyledDropdownContent', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent>
          <a href="#test">Test Link</a>
        </StyledDropdownContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledDropdownContent>
          <a href="#test">Test Link</a>
        </StyledDropdownContent>
      );
      expect(getByText('Test Link')).toBeInTheDocument();
    });

    it('should be a div element', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent>
          <a href="#test">Test Link</a>
        </StyledDropdownContent>
      );
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('should render multiple links correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledDropdownContent>
          <a href="#link1">Link 1</a>
          <a href="#link2">Link 2</a>
          <a href="#link3">Link 3</a>
        </StyledDropdownContent>
      );
      expect(getByText('Link 1')).toBeInTheDocument();
      expect(getByText('Link 2')).toBeInTheDocument();
      expect(getByText('Link 3')).toBeInTheDocument();
    });
  });

  describe('Styled Components Integration', () => {
    it('should render all components together without errors', () => {
      const { getByText } = renderWithTheme(
        <StyledProjectsContainer>
          <StyledPageTitle>Main Title</StyledPageTitle>
          <StyledPageSubtitle>Subtitle</StyledPageSubtitle>
          <StyledProjectsContentDesktop>
            <div>Desktop Content</div>
          </StyledProjectsContentDesktop>
          <StyledDropdownContent>
            <a href="#dropdown">Dropdown Link</a>
          </StyledDropdownContent>
        </StyledProjectsContainer>
      );

      expect(getByText('Main Title')).toBeInTheDocument();
      expect(getByText('Subtitle')).toBeInTheDocument();
      expect(getByText('Desktop Content')).toBeInTheDocument();
      expect(getByText('Dropdown Link')).toBeInTheDocument();
    });
  });
});