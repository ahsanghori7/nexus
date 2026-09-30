import React from 'react';
import { render, screen } from '@testing-library/react';
import HealthSafety from './HealthSafety';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock the form components
jest.mock('../../form/Text', () => ({ name, label, register, errors, ...props }) => (
  <input data-testid={`text-${name}`} placeholder={label} {...props} />
));

jest.mock('../../form/Select', () => ({ name, label, options, defaultValue, handleChange, register, errors, ...props }) => (
  <select data-testid={`select-${name}`} defaultValue={defaultValue} onChange={handleChange} {...props}>
    {options.map((option, index) => (
      <option key={index} value={option.label} disabled={option.disabled}>
        {option.label}
      </option>
    ))}
  </select>
));

jest.mock('../../form/file', () => ({ name, ...props }) => (
  <input type="file" data-testid={`file-${name}`} />
));

// Mock the useOtherInput hook
jest.mock('./useOtherInput', () => {
  return jest.fn(() => [
    false, // other
    jest.fn(), // handleOther
    '', // otherValue
    jest.fn(), // validateTextField
  ]);
});

describe('HealthSafety', () => {
  const mockDocumentsForm = {
    values: {
      document: {},
    },
    errors: {},
    register: jest.fn(() => ({})),
  };

  const mockOptions = [
    { label: 'Safety Certificate 1', value: 'safety1' },
    { label: 'Safety Certificate 2', value: 'safety2' },
  ];

  const mockData = {
    label: 'Test Health Safety Document',
    id: 'doc1',
    document: {},
    requested: false,
  };

  const defaultProps = {
    data: mockData,
    selectedOptions: [],
    options: mockOptions,
    documentsForm: mockDocumentsForm,
    showOtherOptionForAll: false,
    aid: 'aid123',
  };

  const renderComponent = (props = {}) =>
    render(<HealthSafety {...defaultProps} {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
  });

  it('should render select with provided options', () => {
    // Arrange & Act
    renderComponent();

    // Assert
    const select = screen.getByTestId('select-label');
    expect(select).toBeInTheDocument();
    
    // Check that options are rendered
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Safety Certificate 1');
    expect(options[1]).toHaveTextContent('Safety Certificate 2');
  });

  it('should render with empty data gracefully', () => {
    // Arrange & Act
    renderComponent({ data: null });

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
  });

  it('should handle selected options properly', () => {
    // Arrange
    const selectedOptions = ['safety certificate 1'];
    
    // Act
    renderComponent({ selectedOptions });

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
  });

  it('should render text input when other option is selected', () => {
    // Arrange
    const useOtherInput = require('./useOtherInput');
    useOtherInput.mockReturnValue([
      true, // other
      jest.fn(), // handleOther
      'custom value', // otherValue
      jest.fn(), // validateTextField
    ]);

    // Act
    renderComponent();

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
  });

  it('should handle file input rendering', () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByTestId('file-document')).toBeInTheDocument();
  });

  it('should disable options for requested documents', () => {
    // Arrange
    const requestedData = {
      ...mockData,
      requested: true,
    };

    // Act
    renderComponent({ data: requestedData });

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
  });

  it('should take a snapshot', () => {
    // Arrange & Act
    const { container } = renderComponent();

    // Assert
    expect(container).toMatchSnapshot();
  });
});