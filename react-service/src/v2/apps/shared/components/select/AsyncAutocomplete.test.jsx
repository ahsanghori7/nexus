import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AsyncAutocomplete from './AsyncAutocomplete';

jest.mock('@mui/material/Autocomplete', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      options = [],
      value,
      onChange,
      onInputChange,
      getOptionLabel,
      renderInput,
      renderOption,
      slotProps,
      noOptionsText,
    }) => (
      <div data-testid="async-autocomplete">
        {renderInput({
          InputProps: {
            endAdornment: null,
          },
          inputProps: {
            'aria-label': 'async-input',
            value: value ? getOptionLabel(value) : '',
            onChange: (e) => onInputChange?.(e, e.target.value, 'input'),
          },
          onChange: (e) => onInputChange?.(e, e.target.value, 'input'),
          value: value ? getOptionLabel(value) : '',
        })}
        <div data-testid="no-options">{noOptionsText}</div>
        <ul data-testid="async-listbox" {...(slotProps?.listbox || {})}>
          {options.map((option) => {
            if (renderOption) {
              return renderOption(
                {
                  key: option.id,
                  onClick: () => onChange?.(null, option),
                  'data-testid': `async-option-${option.id}`,
                },
                option,
              );
            }
            return (
              <li key={option.id}>
                <button
                  type="button"
                  data-testid={`async-option-${option.id}`}
                  onClick={() => onChange?.(null, option)}
                >
                  {getOptionLabel(option)}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          data-testid="clear-button"
          onClick={() => onInputChange?.(null, '', 'clear')}
        >
          clear
        </button>
      </div>
    ),
  };
});

describe('AsyncAutocomplete', () => {
  const options = [
    { id: 1, name: 'Alpha Project' },
    { id: 2, name: 'Beta Project' },
  ];

  const defaultProps = {
    options,
    value: null,
    onChange: jest.fn(),
    label: 'Pick a project',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the labeled text field', () => {
    render(<AsyncAutocomplete {...defaultProps} />);

    expect(screen.getByLabelText(/pick a project/i)).toBeInTheDocument();
    expect(screen.getByTestId('async-autocomplete')).toBeInTheDocument();
  });

  it('renders options and calls onChange when one is selected', () => {
    render(<AsyncAutocomplete {...defaultProps} />);

    fireEvent.click(screen.getByTestId('async-option-2'));

    expect(defaultProps.onChange).toHaveBeenCalledWith(null, options[1]);
  });

  it('calls onSearch for input and clear when provided (remote mode)', () => {
    const onSearch = jest.fn();
    const onInputChange = jest.fn();

    render(
      <AsyncAutocomplete
        {...defaultProps}
        onSearch={onSearch}
        onInputChange={onInputChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/pick a project/i), {
      target: { value: 'alpha' },
    });

    expect(onSearch).toHaveBeenCalledWith('alpha');
    expect(onInputChange).toHaveBeenCalledWith(
      expect.anything(),
      'alpha',
      'input',
    );

    fireEvent.click(screen.getByTestId('clear-button'));

    expect(onSearch).toHaveBeenCalledWith('');
    expect(onInputChange).toHaveBeenCalledWith(null, '', 'clear');
  });

  it('does not call onSearch when it is not provided', () => {
    const onInputChange = jest.fn();

    render(
      <AsyncAutocomplete {...defaultProps} onInputChange={onInputChange} />,
    );

    fireEvent.change(screen.getByLabelText(/pick a project/i), {
      target: { value: 'alpha' },
    });

    expect(onInputChange).toHaveBeenCalled();
  });

  it('calls onLoadMore when the listbox scrolls near the bottom', () => {
    const onLoadMore = jest.fn();

    render(<AsyncAutocomplete {...defaultProps} onLoadMore={onLoadMore} />);

    const listbox = screen.getByTestId('async-listbox');
    Object.defineProperty(listbox, 'scrollTop', {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(listbox, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(listbox, 'scrollHeight', {
      value: 320,
      configurable: true,
    });
    fireEvent.scroll(listbox);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not call onLoadMore when not near the bottom', () => {
    const onLoadMore = jest.fn();

    render(<AsyncAutocomplete {...defaultProps} onLoadMore={onLoadMore} />);

    const listbox = screen.getByTestId('async-listbox');
    Object.defineProperty(listbox, 'scrollTop', {
      value: 0,
      configurable: true,
    });
    Object.defineProperty(listbox, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(listbox, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    fireEvent.scroll(listbox);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('shows a loading indicator when loading or loadingMore is true', () => {
    const { rerender } = render(
      <AsyncAutocomplete {...defaultProps} loading />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<AsyncAutocomplete {...defaultProps} loadingMore />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error and helper text on the text field', () => {
    render(
      <AsyncAutocomplete
        {...defaultProps}
        error
        helperText="Something went wrong"
        noOptionsText="No matches"
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('no-options')).toHaveTextContent('No matches');
  });

  it('uses a custom getOptionLabel when provided', () => {
    render(
      <AsyncAutocomplete
        {...defaultProps}
        getOptionLabel={(option) => `CODE:${option.id}`}
      />,
    );

    expect(screen.getByText('CODE:1')).toBeInTheDocument();
    expect(screen.getByText('CODE:2')).toBeInTheDocument();
  });
});
