import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import '@testing-library/jest-dom';
import { StyledCheckboxWrapper, EditorWrapper, TwoFieldsWrapper } from './styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxGreen: '#4CAF50',
        boxInset: '#CCCCCC',
        prosperCursorGray: '#F5F5F5',
        prosperCursorGrayDark: '#DDDDDD',
        prosperBoxRed: '#F44336',
      },
      general: {
        white: '#FFFFFF',
        japaneseIndigo: '#1976D2',
        platinum: '#E5E5E5',
      },
    },
    s3: {
      checkmarkGreen: 'data:image/svg+xml;base64,mock-checkmark-icon',
    },
    dimensions: {
      XL_SCREEN: 1200,
    },
  },
}));

// Mock theme for styled-components
const mockTheme = {};

describe('styled.jsx components', () => {
  describe('StyledCheckboxWrapper', () => {
    it('renders as a styled div', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <StyledCheckboxWrapper data-testid="checkbox-wrapper">
            <input type="checkbox" data-testid="checkbox-input" />
          </StyledCheckboxWrapper>
        </ThemeProvider>
      );

      expect(screen.getByTestId('checkbox-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-input')).toBeInTheDocument();
    });

    it('renders checkbox input correctly', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <StyledCheckboxWrapper>
            <input type="checkbox" data-testid="checkbox" />
          </StyledCheckboxWrapper>
        </ThemeProvider>
      );

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('handles checked state', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <StyledCheckboxWrapper>
            <input type="checkbox" checked data-testid="checked-checkbox" readOnly />
          </StyledCheckboxWrapper>
        </ThemeProvider>
      );

      const checkbox = screen.getByTestId('checked-checkbox');
      expect(checkbox).toBeChecked();
    });

    it('handles unchecked state', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <StyledCheckboxWrapper>
            <input type="checkbox" data-testid="unchecked-checkbox" />
          </StyledCheckboxWrapper>
        </ThemeProvider>
      );

      const checkbox = screen.getByTestId('unchecked-checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('renders with label', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <StyledCheckboxWrapper>
            <div className="clink-form__input">
              <input type="checkbox" data-testid="checkbox-with-label" />
              <label>Test Label</label>
            </div>
          </StyledCheckboxWrapper>
        </ThemeProvider>
      );

      expect(screen.getByTestId('checkbox-with-label')).toBeInTheDocument();
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });
  });

  describe('EditorWrapper', () => {
    it('renders children correctly', () => {
      render(
        <EditorWrapper>
          <div data-testid="editor-child">Editor Content</div>
        </EditorWrapper>
      );

      expect(screen.getByTestId('editor-child')).toBeInTheDocument();
      expect(screen.getByText('Editor Content')).toBeInTheDocument();
    });

    it('renders without label when label is empty', () => {
      render(
        <EditorWrapper label="">
          <div data-testid="editor-no-label">Content</div>
        </EditorWrapper>
      );

      expect(screen.getByTestId('editor-no-label')).toBeInTheDocument();
      // Should not render any Typography element for empty label
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders without label when label is not provided', () => {
      render(
        <EditorWrapper>
          <div data-testid="editor-no-label-prop">Content</div>
        </EditorWrapper>
      );

      expect(screen.getByTestId('editor-no-label-prop')).toBeInTheDocument();
      // Should not render any Typography element when label is not provided
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders with label when provided', () => {
      render(
        <EditorWrapper label="Test Editor Label">
          <div data-testid="editor-with-label">Content</div>
        </EditorWrapper>
      );

      expect(screen.getByTestId('editor-with-label')).toBeInTheDocument();
      expect(screen.getByText('Test Editor Label')).toBeInTheDocument();
    });

    it('renders label with correct styling', () => {
      render(
        <EditorWrapper label="Styled Label">
          <div>Content</div>
        </EditorWrapper>
      );

      const label = screen.getByText('Styled Label');
      expect(label).toBeInTheDocument();
      // Check that it's a Typography component (rendered as p by default in MUI mock)
      expect(label.tagName.toLowerCase()).toBe('div');
    });

    it('handles multiple children', () => {
      render(
        <EditorWrapper label="Multiple Children">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </EditorWrapper>
      );

      expect(screen.getByText('Multiple Children')).toBeInTheDocument();
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders editor toolbar and container classes', () => {
      render(
        <EditorWrapper>
          <div className="ql-toolbar" data-testid="toolbar">Toolbar</div>
          <div className="ql-container" data-testid="container">
            <div className="ql-editor" data-testid="editor">Editor</div>
          </div>
        </EditorWrapper>
      );

      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('container')).toBeInTheDocument();
      expect(screen.getByTestId('editor')).toBeInTheDocument();
    });
  });

  describe('TwoFieldsWrapper', () => {
    it('renders children correctly', () => {
      render(
        <TwoFieldsWrapper>
          <div data-testid="two-fields-child">Field Content</div>
        </TwoFieldsWrapper>
      );

      expect(screen.getByTestId('two-fields-child')).toBeInTheDocument();
      expect(screen.getByText('Field Content')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <TwoFieldsWrapper>
          <div data-testid="field-1">Field 1</div>
          <div data-testid="field-2">Field 2</div>
        </TwoFieldsWrapper>
      );

      expect(screen.getByTestId('field-1')).toBeInTheDocument();
      expect(screen.getByTestId('field-2')).toBeInTheDocument();
    });

    it('renders with clink-form__input class structure', () => {
      render(
        <TwoFieldsWrapper>
          <div className="clink-form__input" data-testid="form-input">
            <button className="change-mode-btn" data-testid="change-mode-btn">
              Change Mode
            </button>
          </div>
        </TwoFieldsWrapper>
      );

      expect(screen.getByTestId('form-input')).toBeInTheDocument();
      expect(screen.getByTestId('change-mode-btn')).toBeInTheDocument();
      expect(screen.getByText('Change Mode')).toBeInTheDocument();
    });

    it('renders change mode button with correct styling', () => {
      render(
        <TwoFieldsWrapper>
          <div className="clink-form__input">
            <button className="change-mode-btn" data-testid="styled-button">
              Switch Mode
            </button>
          </div>
        </TwoFieldsWrapper>
      );

      const button = screen.getByTestId('styled-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Switch Mode');
      expect(button).toHaveClass('change-mode-btn');
    });

    it('handles complex nested structure', () => {
      render(
        <TwoFieldsWrapper>
          <div className="clink-form__input" data-testid="input-wrapper-1">
            <input type="text" data-testid="text-input-1" />
            <button className="change-mode-btn">Button 1</button>
          </div>
          <div className="clink-form__input" data-testid="input-wrapper-2">
            <input type="text" data-testid="text-input-2" />
            <button className="change-mode-btn">Button 2</button>
          </div>
        </TwoFieldsWrapper>
      );

      expect(screen.getByTestId('input-wrapper-1')).toBeInTheDocument();
      expect(screen.getByTestId('input-wrapper-2')).toBeInTheDocument();
      expect(screen.getByTestId('text-input-1')).toBeInTheDocument();
      expect(screen.getByTestId('text-input-2')).toBeInTheDocument();
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });
  });

  describe('All Components Integration', () => {
    it('can be used together in complex structure', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <TwoFieldsWrapper>
            <EditorWrapper label="Combined Test">
              <StyledCheckboxWrapper>
                <input type="checkbox" data-testid="integrated-checkbox" />
              </StyledCheckboxWrapper>
              <div data-testid="integrated-content">Combined content</div>
            </EditorWrapper>
          </TwoFieldsWrapper>
        </ThemeProvider>
      );

      expect(screen.getByText('Combined Test')).toBeInTheDocument();
      expect(screen.getByTestId('integrated-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('integrated-content')).toBeInTheDocument();
    });
  });
});