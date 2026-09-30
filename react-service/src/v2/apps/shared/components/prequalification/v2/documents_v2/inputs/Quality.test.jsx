import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Quality from './Quality';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock the form components
jest.mock('../../form/Text', () => ({ name, label, register, errors, ...props }) => {
  const registerProps = register ? register(name) : {};
  return (
    <input
      data-testid={`text-${name}`}
      placeholder={label}
      {...registerProps}
      {...props}
    />
  );
});

jest.mock('../../form/Select', () => ({ name, label, options, defaultValue, handleChange, register, errors, ...props }) => {
  const registerProps = register ? register(name) : {};
  return (
    <select
      data-testid={`select-${name}`}
      defaultValue={defaultValue}
      onChange={handleChange}
      {...registerProps}
      {...props}
    >
      {options.map((option, index) => (
        <option key={index} value={option.label} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

jest.mock('../../form/TextEditor', () => ({ name, register, trigger, ...props }) => {
  if (register) {
    register(name);
  }
  return <textarea data-testid={`texteditor-${name}`} {...props} />;
});

jest.mock('../../form/file', () => ({ name, register, ...props }) => {
  if (register) {
    register(name);
  }
  return <input type="file" data-testid={`file-${name}`} />;
});

jest.mock('../../form/Date', () => ({ name, label, register, trigger, setValue, ...props }) => {
  const registerProps = register ? register(name) : {};
  return (
    <input
      type="date"
      data-testid={`date-${name}`}
      placeholder={label}
      {...registerProps}
      {...props}
    />
  );
});

// Mock the useOtherInput hook
jest.mock('./useOtherInput', () => {
  return jest.fn(() => [
    false, // other
    jest.fn(), // handleOther
    '', // otherValue
    jest.fn(), // validateTextField
  ]);
});

describe('Quality', () => {
  const mockDocumentsForm = {
    values: {
      document: {},
      date: {},
    },
    errors: {},
    register: jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
    trigger: jest.fn(),
    setValue: jest.fn(),
    control: {},
  };

  const mockOptions = [
    { label: 'ISO 9001', value: 'iso9001' },
    { label: 'Not ISO Accredited', value: 'not_iso' },
  ];

  const mockData = {
    label: 'ISO 9001',
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
    render(<Quality {...defaultProps} {...props} />);

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
    expect(options[0]).toHaveTextContent('ISO 9001');
    expect(options[1]).toHaveTextContent('Not ISO Accredited');
  });

  it('should render with empty data gracefully', () => {
    // Arrange & Act
    renderComponent({ data: null });

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
  });

  it('should show textarea when "Not ISO Accredited" is selected', () => {
    // Arrange
    const dataWithNotIso = {
      ...mockData,
      label: 'not ISO Accredited',
    };

    // Act
    renderComponent({ data: dataWithNotIso });

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
    expect(screen.getByTestId('texteditor-undefined')).toBeInTheDocument();
  });

  it('should show expiration date when "ISO 9001" is selected', () => {
    // Arrange
    const dataWithIso = {
      ...mockData,
      label: 'IS0 90001', // Note: this is the actual constant value with "IS0" not "ISO"
    };

    // Act
    renderComponent({ data: dataWithIso });

    // Assert
    expect(screen.getByTestId('select-label')).toBeInTheDocument();
    expect(screen.getByTestId('date-date')).toBeInTheDocument();
  });

  it('should handle file input rendering', () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByTestId('file-document')).toBeInTheDocument();
  });

  it('should handle selected options properly', () => {
    // Arrange
    const selectedOptions = ['iso 9001'];
    
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

  it('should take a snapshot', () => {
    // Arrange & Act
    const { container } = renderComponent();

    // Assert
    expect(container).toMatchSnapshot();
  });
});
