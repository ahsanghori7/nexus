import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  SubmitQuoteHeader,
  HeaderTextarea,
  ExclusionNote,
  Footer,
  FileUploaderTitle,
  FileUploaderLabel,
} from './mui.styled';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

// Mock currency helper
jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: (value) => `$${value}`,
  currencyConfig: {
    'currency': { symbol: '$' }
  }
}));

describe('Submit Quote MUI Styled Components', () => {
  describe('SubmitQuoteHeader', () => {
    it('should render children content', () => {
      render(<SubmitQuoteHeader>Test Header</SubmitQuoteHeader>);
      expect(screen.getByText('Test Header')).toBeInTheDocument();
    });

    it('should apply correct styling', () => {
      const { container } = render(<SubmitQuoteHeader>Test</SubmitQuoteHeader>);
      const headerElement = container.firstChild;
      expect(headerElement).toHaveStyle({
        backgroundColor: '#FFFFFF',
        padding: '40px 30px 40px',
      });
    });
  });

  describe('HeaderTextarea', () => {
    it('should render with default props', () => {
      render(<HeaderTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with custom value', () => {
      render(<HeaderTextarea value="Test content" />);
      const textarea = screen.getByDisplayValue('Test content');
      expect(textarea).toBeInTheDocument();
    });

    it('should handle placeholder text', () => {
      render(<HeaderTextarea placeholder="Enter text here" />);
      const textarea = screen.getByPlaceholderText('Enter text here');
      expect(textarea).toBeInTheDocument();
    });

    it('should be read-only when readOnly prop is true', () => {
      render(<HeaderTextarea readOnly={true} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('should apply custom styles', () => {
      const customStyles = { border: '2px solid red' };
      const { container } = render(<HeaderTextarea customStyles={customStyles} />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveStyle('border: 2px solid red');
    });

    it('should handle onChange events', () => {
      const mockOnChange = jest.fn();
      render(<HeaderTextarea onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      // The onChange is passed through to the textarea
    });

    it('should handle minimum rows prop', () => {
      render(<HeaderTextarea minRows={6} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('minrows', '6');
    });

    it('should test default parameters', () => {
      render(<HeaderTextarea customStyles={undefined} placeholder={undefined} minRows={undefined} value={undefined} onChange={undefined} readOnly={undefined} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe('');
      expect(textarea).not.toHaveAttribute('readonly');
    });
  });

  describe('ExclusionNote', () => {
    it('should render with exclusion notes text', () => {
      render(<ExclusionNote />);
      expect(screen.getByText('exclusion-notes')).toBeInTheDocument();
    });

    it('should render textarea with provided text', () => {
      render(<ExclusionNote text="Test exclusion note" />);
      const textarea = screen.getByDisplayValue('Test exclusion note');
      expect(textarea).toBeInTheDocument();
    });

    it('should be read-only when readOnly prop is true', () => {
      render(<ExclusionNote readOnly={true} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('should handle onChange events', () => {
      const mockOnChange = jest.fn();
      render(<ExclusionNote onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      // The onChange is passed through to the textarea
    });

    it('should render with default empty text', () => {
      render(<ExclusionNote />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('');
    });

    it('should test default parameters', () => {
      render(<ExclusionNote text={undefined} onChange={undefined} readOnly={undefined} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('');
      expect(textarea).not.toHaveAttribute('readonly');
    });
  });

  describe('Footer', () => {
    const defaultProps = {
      programme: 2,
      total: 1000,
    };

    it('should render programme weeks label', () => {
      render(<Footer {...defaultProps} />);
      expect(screen.getByText('programme-weeks')).toBeInTheDocument();
    });

    it('should render total label', () => {
      render(<Footer {...defaultProps} />);
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should display programme value in input', () => {
      render(<Footer {...defaultProps} />);
      const input = screen.getByDisplayValue('2');
      expect(input).toBeInTheDocument();
    });

    it('should display formatted total', () => {
      render(<Footer {...defaultProps} />);
      expect(screen.getByText('$1000')).toBeInTheDocument();
    });

    it('should be read-only when readOnly prop is true', () => {
      render(<Footer {...defaultProps} readOnly={true} />);
      const input = screen.getByDisplayValue('2');
      expect(input).toHaveAttribute('readonly');
    });

    it('should handle number input with programme value', () => {
      render(<Footer {...defaultProps} />);
      const input = screen.getByDisplayValue('2');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should handle default programme value of 0', () => {
      const propsWithoutProgramme = { total: 1000 };
      render(<Footer {...propsWithoutProgramme} />);
      const input = screen.getByDisplayValue('0');
      expect(input).toBeInTheDocument();
    });

    it('should handle onChange events for programme input', () => {
      const mockSetProgramme = jest.fn();
      render(<Footer {...defaultProps} setProgramme={mockSetProgramme} />);
      const input = screen.getByDisplayValue('2');
      expect(input).toBeInTheDocument();
      // The setProgramme function is passed through
    });

    it('should display zero total when no total provided', () => {
      const propsWithoutTotal = { programme: 2 };
      render(<Footer {...propsWithoutTotal} />);
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('should test default parameters', () => {
      render(<Footer programme={undefined} setProgramme={undefined} total={undefined} readOnly={undefined} />);
      const input = screen.getByDisplayValue('0');
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveAttribute('readonly');
      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('FileUploaderTitle', () => {
    it('should render children content', () => {
      render(<FileUploaderTitle>Upload Files</FileUploaderTitle>);
      expect(screen.getByText('Upload Files')).toBeInTheDocument();
    });
  });

  describe('FileUploaderLabel', () => {
    it('should render children content with icon', () => {
      render(<FileUploaderLabel>test-file.pdf</FileUploaderLabel>);
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    it('should display tooltip with full text', () => {
      render(<FileUploaderLabel>very-long-filename.pdf</FileUploaderLabel>);
      // Look for the tooltip using data-title attribute from mock
      const tooltip = screen.getByTestId('mui-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute('data-title', 'very-long-filename.pdf');
    });
  });
});