import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  StyledAddNewWrapper,
  StyledDropdownColumn,
  StyledAddDescriptionColumn,
  StyledAddAppendixColumn,
  StyledAddButtons,
  StyledButtonsWrapper,
  StyledBond,
  StyledValueColumnLeft,
  StyledValueColumnRight,
} from './styled';

// Mock theme for styled-components
const mockTheme = {
  colors: {
    general: {
      white: '#ffffff',
      clinkGreen: '#00A651',
      ruby: '#CC0000',
      eerieBlack: '#1B1B1B',
      clinkPurple2: '#8B5CF6',
    },
  },
  dimensions: {
    XL_SCREEN: 1200,
    LG_SCREEN: 992,
    MD_SCREEN: 768,
    SM_SCREEN: 576,
  },
  fonts: {
    proxima_nova1: 'Proxima Nova',
    proxima_nova2: 'Proxima Nova',
  },
};

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('Styled components', () => {
  it('renders StyledAddNewWrapper without crashing', () => {
    const { container } = renderWithTheme(
      <StyledAddNewWrapper>
        <div>Test content</div>
      </StyledAddNewWrapper>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledDropdownColumn without crashing', () => {
    const { container } = renderWithTheme(
      <StyledDropdownColumn>
        <div>Test content</div>
      </StyledDropdownColumn>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledAddDescriptionColumn without crashing', () => {
    const { container } = renderWithTheme(
      <StyledAddDescriptionColumn>
        <div>Test content</div>
      </StyledAddDescriptionColumn>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledAddAppendixColumn without crashing', () => {
    const { container } = renderWithTheme(
      <StyledAddAppendixColumn>
        <div>Test content</div>
      </StyledAddAppendixColumn>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledAddButtons without crashing', () => {
    const { container } = renderWithTheme(
      <StyledAddButtons>
        <div>Test content</div>
      </StyledAddButtons>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledButtonsWrapper without crashing', () => {
    const { container } = renderWithTheme(
      <StyledButtonsWrapper>
        <div>Test content</div>
      </StyledButtonsWrapper>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledBond without crashing', () => {
    const { container } = renderWithTheme(
      <StyledBond>
        <div>Test content</div>
      </StyledBond>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledValueColumnLeft without crashing', () => {
    const { container } = renderWithTheme(
      <StyledValueColumnLeft>
        <div>Test content</div>
      </StyledValueColumnLeft>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders StyledValueColumnRight without crashing', () => {
    const { container } = renderWithTheme(
      <StyledValueColumnRight>
        <div>Test content</div>
      </StyledValueColumnRight>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});