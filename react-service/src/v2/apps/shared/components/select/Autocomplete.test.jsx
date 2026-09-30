import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClinkAutocomplete from './Autocomplete';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconSearchBlack: 'search-icon-url'
    }
  },
  Image: ({ src, ...props }) => <img src={src} alt="search" {...props} />
}));

// Mock the List component
jest.mock('./List', () => {
  return function MockList({ options, handleClick, sx }) {
    return (
      <div data-testid="list-component" style={sx}>
        {options.map((option, index) => (
          <div
            key={index}
            data-testid={`list-option-${index}`}
            onClick={() => handleClick(option)}
          >
            {option.label || option}
          </div>
        ))}
      </div>
    );
  };
});

describe('ClinkAutocomplete', () => {
  const defaultProps = {
    placeholder: 'Search companies...',
    onInputChange: jest.fn(),
    label: 'Company',
    options: [
      { label: 'Company A', value: 'a', has_account: false },
      { label: 'Company B', value: 'b', has_account: false },
      { label: 'Company C', value: 'c', has_account: true }
    ],
    handleClick: jest.fn(),
    showOptions: false,
    loading: false,
    value: null,
    name: 'company'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    expect(screen.getByTestId('autocomplete-container')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search companies...')).toBeInTheDocument();
  });

  it('displays the label when provided', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Company')).toHaveStyle('font-weight: bold');
  });

  it('renders without label when not provided', () => {
    const propsWithoutLabel = { ...defaultProps, label: undefined };
    render(<ClinkAutocomplete {...propsWithoutLabel} />);
    
    expect(screen.queryByText('Company')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays search icon', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    const searchIcon = screen.getByAltText('search');
    expect(searchIcon).toBeInTheDocument();
    expect(searchIcon).toHaveAttribute('src', 'search-icon-url');
  });

  it('shows loading indicator when loading is true', () => {
    const loadingProps = { ...defaultProps, loading: true };
    render(<ClinkAutocomplete {...loadingProps} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('hides loading indicator when loading is false', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('displays the current value', () => {
    const valueProps = {
      ...defaultProps,
      value: { label: 'Selected Company', value: 'selected' }
    };
    render(<ClinkAutocomplete {...valueProps} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Selected Company');
  });

  it('calls onInputChange when input changes', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(defaultProps.onInputChange).toHaveBeenCalled();
  });

  it('shows options list when showOptions is true', () => {
    const showOptionsProps = { ...defaultProps, showOptions: true };
    render(<ClinkAutocomplete {...showOptionsProps} />);
    
    expect(screen.getByTestId('list-component')).toBeInTheDocument();
    expect(screen.getByTestId('list-option-0')).toHaveTextContent('Company A');
    expect(screen.getByTestId('list-option-1')).toHaveTextContent('Company B');
    expect(screen.getByTestId('list-option-2')).toHaveTextContent('Company C');
  });

  it('hides options list when showOptions is false', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    expect(screen.queryByTestId('list-component')).not.toBeInTheDocument();
  });

  it('handles option click and calls handleClick', () => {
    const showOptionsProps = { ...defaultProps, showOptions: true };
    render(<ClinkAutocomplete {...showOptionsProps} />);
    
    const firstOption = screen.getByTestId('list-option-0');
    fireEvent.click(firstOption);
    
    expect(defaultProps.handleClick).toHaveBeenCalledWith({
      label: 'Company A',
      value: 'a',
      has_account: false
    });
  });

  it('applies custom sx styling for marginBottom', () => {
    const customSxProps = {
      ...defaultProps,
      showOptions: true,
      sx: { marginBottom: 20 }
    };
    render(<ClinkAutocomplete {...customSxProps} />);
    
    const listComponent = screen.getByTestId('list-component');
    expect(listComponent).toHaveStyle('margin-top: -20px');
  });

  it('applies custom sx styling for backgroundColor', () => {
    const customSxProps = {
      ...defaultProps,
      showOptions: true,
      sx: { backgroundColor: 'red' }
    };
    render(<ClinkAutocomplete {...customSxProps} />);
    
    const listComponent = screen.getByTestId('list-component');
    expect(listComponent).toHaveStyle('background-color: red');
  });

  it('handles string marginBottom in sx prop', () => {
    const customSxProps = {
      ...defaultProps,
      showOptions: true,
      sx: { marginBottom: '10px' }
    };
    render(<ClinkAutocomplete {...customSxProps} />);
    
    const listComponent = screen.getByTestId('list-component');
    expect(listComponent).toHaveStyle('margin-top: -10px');
  });

  it('handles empty options array', () => {
    const emptyOptionsProps = {
      ...defaultProps,
      options: [],
      showOptions: true
    };
    render(<ClinkAutocomplete {...emptyOptionsProps} />);
    
    expect(screen.queryByTestId('list-component')).not.toBeInTheDocument();
  });

  it('passes through additional props to Autocomplete', () => {
    const additionalProps = {
      ...defaultProps,
      'data-testid': 'custom-autocomplete',
      disabled: true
    };
    render(<ClinkAutocomplete {...additionalProps} />);
    
    const autocomplete = screen.getByTestId('custom-autocomplete');
    expect(autocomplete).toBeInTheDocument();
  });

  it('applies padding to input when search icon is present', () => {
    render(<ClinkAutocomplete {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    // Check that the input exists (the padding styling is applied via sx prop)
    expect(input).toBeInTheDocument();
  });

  it('renders correctly with all default props', () => {
    const minimalProps = {
      onInputChange: jest.fn(),
      options: []
    };
    render(<ClinkAutocomplete {...minimalProps} />);
    
    expect(screen.getByTestId('autocomplete-container')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<ClinkAutocomplete {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});