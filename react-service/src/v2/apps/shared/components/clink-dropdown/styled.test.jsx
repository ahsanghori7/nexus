import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledDropdownContent } from './styled';

// Mock styled-components theme
const mockTheme = {
  colors: {
    general: {
      clinkLightPurple: '#E6E6FA',
      white: '#FFFFFF',
      darkCharcoal: '#36454F',
    },
  },
};

describe('Clink Dropdown Styled Components', () => {
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('StyledDropdownContent', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent>Test Content</StyledDropdownContent>
      );
      expect(container).toBeInTheDocument();
    });

    it('displays children content', () => {
      const testContent = 'Test Dropdown Content';
      const { getByText } = renderWithTheme(
        <StyledDropdownContent>{testContent}</StyledDropdownContent>
      );
      expect(getByText(testContent)).toBeInTheDocument();
    });

    it('applies left-align class correctly', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent className="left-align">
          Test Content
        </StyledDropdownContent>
      );
      const styledElement = container.firstChild;
      expect(styledElement).toHaveClass('left-align');
    });

    it('has correct display flex styles', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent>Test Content</StyledDropdownContent>
      );
      const styledElement = container.firstChild;
      expect(styledElement).toHaveStyle('display: flex');
      expect(styledElement).toHaveStyle('flex-direction: column');
      expect(styledElement).toHaveStyle('position: relative');
    });

    it('handles multiple children', () => {
      const { getByText } = renderWithTheme(
        <StyledDropdownContent>
          <div>First Child</div>
          <div>Second Child</div>
          <button>Third Child Button</button>
        </StyledDropdownContent>
      );
      
      expect(getByText('First Child')).toBeInTheDocument();
      expect(getByText('Second Child')).toBeInTheDocument();
      expect(getByText('Third Child Button')).toBeInTheDocument();
    });

    it('can contain interactive elements', () => {
      const { getByRole } = renderWithTheme(
        <StyledDropdownContent>
          <button>Click Me</button>
          <a href="/test">Link</a>
        </StyledDropdownContent>
      );
      
      expect(getByRole('button')).toBeInTheDocument();
      expect(getByRole('link')).toBeInTheDocument();
    });

    it('takes a snapshot', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent className="left-align">
          <div>Dropdown Item 1</div>
          <button>Dropdown Item 2</button>
          <a href="/test">Dropdown Link</a>
        </StyledDropdownContent>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('takes a snapshot without left-align class', () => {
      const { container } = renderWithTheme(
        <StyledDropdownContent>
          <div>Simple Content</div>
        </StyledDropdownContent>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});