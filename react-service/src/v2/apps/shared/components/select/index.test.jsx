import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SelectDialog from './index';

// Mock dependencies
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('v2/helpers/data', () => ({
  b64EncodeUnicode: jest.fn((str) => btoa(str)),
  UnicodeDecodeB64: jest.fn((str) => atob(str)),
}));

jest.mock('v2/apps/widgets/opportunity-viewer/config', () => ({
  subdomain: 'test-subdomain',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        all: 'All',
        'reset-filters': 'Reset Filters',
        apply: 'Apply',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('./Autocomplete', () => {
  return function MockAutocomplete({ onInputChange, placeholder, ...props }) {
    return (
      <input
        data-testid="autocomplete-input"
        placeholder={placeholder}
        onChange={(e) => onInputChange && onInputChange(['', e.target.value])}
        {...props}
      />
    );
  };
});

jest.mock('./Placeholder', () => {
  return function MockPlaceholder({ left, right, title, children }) {
    return (
      <div data-testid={`placeholder-${left ? 'left' : 'right'}`}>
        {title && <span>{title}</span>}
        {children}
      </div>
    );
  };
});

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const openModal = (name = 'test-select') => {
  fireEvent.click(screen.getByTestId(`${name}-open-modal`));
};

const getCheckbox = (index) => screen.getByTestId(`checkbox-option-${index}`);

describe('SelectDialog Component', () => {
  const defaultOptions = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' },
  ];

  const defaultProps = {
    options: defaultOptions,
    title: 'Test Title',
    placeholder: 'Search...',
    setter: jest.fn(),
    name: 'test-select',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const Cookies = require('js-cookie');
    Cookies.get.mockReset();
    Cookies.set.mockReset();
    Cookies.remove.mockReset();
  });

  it('renders without crashing', () => {
    renderWithTheme(<SelectDialog {...defaultProps} />);
    expect(screen.getByTestId('test-select-open-modal')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', () => {
    renderWithTheme(<SelectDialog {...defaultProps} />);
    openModal();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders all options as checkboxes', () => {
    renderWithTheme(<SelectDialog {...defaultProps} />);
    openModal();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('handles option selection', () => {
    const mockSetter = jest.fn();
    renderWithTheme(<SelectDialog {...defaultProps} setter={mockSetter} />);
    openModal();
    const firstCheckbox = getCheckbox(0);
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();
  });

  it('shows search input when disableSearch is false', () => {
    renderWithTheme(<SelectDialog {...defaultProps} disableSearch={false} />);
    openModal();
    expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
  });

  it('hides search input when disableSearch is true', () => {
    renderWithTheme(<SelectDialog {...defaultProps} disableSearch={true} />);
    openModal();
    expect(screen.queryByTestId('autocomplete-input')).not.toBeInTheDocument();
  });

  it('handles cookie storage when hasCookie is true', () => {
    const Cookies = require('js-cookie');
    const { b64EncodeUnicode } = require('v2/helpers/data');
    
    renderWithTheme(
      <SelectDialog 
        {...defaultProps} 
        hasCookie="test-cookie"
        name="test-select"
      />
    );
    openModal();
    fireEvent.click(getCheckbox(0));
    expect(Cookies.set).toHaveBeenCalled();
    expect(b64EncodeUnicode).toHaveBeenCalled();
  });

  it('loads initial values from cookie', () => {
    const Cookies = require('js-cookie');
    const { UnicodeDecodeB64 } = require('v2/helpers/data');
    
    // Mock cookie data
    const cookieData = JSON.stringify({ 'test-select': [defaultOptions[0]] });
    Cookies.get.mockReturnValue(btoa(cookieData));
    UnicodeDecodeB64.mockReturnValue(cookieData);
    
    renderWithTheme(
      <SelectDialog 
        {...defaultProps} 
        hasCookie="test-cookie"
        name="test-select"
      />
    );
    
    expect(Cookies.get).toHaveBeenCalledWith('test-cookie', 'test-subdomain');
  });

  it('handles basic functionality with multiple props', () => {
    const mockSetter = jest.fn();
    const mockUpdateValues = jest.fn();
    
    renderWithTheme(
      <SelectDialog 
        {...defaultProps} 
        setter={mockSetter} 
        updateValues={mockUpdateValues}
        showAllText={true}
        activeSelectAll={true}
      />
    );
    
    // Open modal
    fireEvent.click(screen.getByTestId('test-select-open-modal'));
    
    // Verify modal opened
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Verify options are present
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('handles component with uncheck mode', () => {
    const mockUncheckAction = jest.fn();
    renderWithTheme(
      <SelectDialog 
        {...defaultProps} 
        uncheck={true}
        uncheckAction={mockUncheckAction}
      />
    );
    
    // Component should render with uncheck mode
    expect(screen.getByTestId('test-select-open-modal')).toBeInTheDocument();
  });

  it('toggles an option off when already selected and rewrites cookies', () => {
    const Cookies = require('js-cookie');
    Cookies.get
      .mockReturnValueOnce(null) // initial getInitial
      .mockReturnValueOnce(null) // first handleChange call
      .mockReturnValueOnce(
        btoa(JSON.stringify({ 'test-select': [defaultOptions[0]] })),
      );

    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        hasCookie="test-cookie"
        name="test-select"
      />
    );

    openModal();
    const option = getCheckbox(0);
    fireEvent.click(option);
    expect(option).toBeChecked();
    fireEvent.click(option);
    expect(option).not.toBeChecked();
    expect(Cookies.set).toHaveBeenCalled();
    const lastCall = Cookies.set.mock.calls[Cookies.set.mock.calls.length - 1];
    const payload = JSON.parse(atob(lastCall[1]));
    expect(payload['test-select']).toEqual([]);
  });

  it('invokes uncheckAction and skips cookie writes when uncheck prop is true', () => {
    const Cookies = require('js-cookie');
    Cookies.get.mockReturnValue(null);
    const uncheckAction = jest.fn();
    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        uncheck
        uncheckAction={uncheckAction}
        hasCookie="test-cookie"
        name="test-select"
      />
    );

    openModal();
    fireEvent.click(getCheckbox(1));
    expect(uncheckAction).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Option 2' })
    );
    expect(Cookies.set).not.toHaveBeenCalled();
  });

  it('filters options locally when no search callback is provided', () => {
    renderWithTheme(<SelectDialog {...defaultProps} />);
    openModal();
    const searchInput = screen.getByTestId('autocomplete-input');
    fireEvent.change(searchInput, { target: { value: 'Option 2' } });
    const list = screen.getByTestId('checkbox-options');
    expect(within(list).getByText('Option 2')).toBeInTheDocument();
    expect(within(list).queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('delegates search to callback when provided', () => {
    const searchCallback = jest.fn();
    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        searchCallback={searchCallback}
      />
    );
    openModal();
    const searchInput = screen.getByTestId('autocomplete-input');
    fireEvent.change(searchInput, { target: { value: 'Option' } });
    expect(searchCallback).toHaveBeenCalledWith('option');
  });

  it('selects and clears all options using the select all control', () => {
    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        activeSelectAll
      />
    );
    openModal();
    const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
    fireEvent.click(selectAll);
    defaultOptions.forEach((_, idx) => {
      expect(getCheckbox(idx)).toBeChecked();
    });
    fireEvent.click(selectAll);
    defaultOptions.forEach((_, idx) => {
      expect(getCheckbox(idx)).not.toBeChecked();
    });
  });

  it('resets filters and clears cookies when reset button is pressed', () => {
    const Cookies = require('js-cookie');
    Cookies.get.mockReturnValue(null);
    const setter = jest.fn();
    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        setter={setter}
        hasCookie="test-cookie"
        name="test-select"
      />
    );
    openModal();
    fireEvent.click(getCheckbox(0));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));
    expect(Cookies.remove).toHaveBeenCalledWith('test-cookie', 'test-subdomain');
    expect(setter).toHaveBeenCalledWith([]);
  });

  it('applies changes and triggers update callbacks', async () => {
    const updateValues = jest.fn();
    const setter = jest.fn();
    const onCloseCallback = jest.fn();
    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        updateValues={updateValues}
        setter={setter}
        onCloseCallback={onCloseCallback}
      />
    );
    openModal();
    fireEvent.click(getCheckbox(2));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(updateValues).toHaveBeenCalled());
    expect(updateValues.mock.calls[0][0]).toEqual(
      expect.arrayContaining([defaultOptions[2]])
    );
    await waitFor(() => expect(onCloseCallback).toHaveBeenCalled());
  });

  it('restores initial options and cookies when the close icon is clicked', async () => {
    const Cookies = require('js-cookie');
    Cookies.get.mockReturnValue(null);
    const setter = jest.fn();
    const initialOption = {
      'test-select': [defaultOptions[1]],
      lastCookie: 'encoded-cookie',
    };
    renderWithTheme(
      <SelectDialog
        {...defaultProps}
        setter={setter}
        initialOption={initialOption}
        hasCookie="test-cookie"
        name="test-select"
      />
    );
    openModal();
    fireEvent.click(getCheckbox(0));
    fireEvent.click(screen.getByLabelText('Close dialog'));

    await waitFor(() =>
      expect(setter).toHaveBeenLastCalledWith(initialOption['test-select'])
    );
    expect(Cookies.set).toHaveBeenCalledWith(
      'test-cookie',
      'encoded-cookie',
      'test-subdomain'
    );
  });
});
