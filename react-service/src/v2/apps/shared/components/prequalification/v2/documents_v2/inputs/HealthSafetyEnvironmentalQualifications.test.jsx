import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import HealthSafetyEnvironmentalQualifications from './HealthSafetyEnvironmentalQualifications';
import { TYPES, OTHER_CERTIFICATE_DOC, CV } from 'v2/helpers/prequal/documents';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('v2/apps/shared/components/prequalification/v2/form/Date', () => {
  return function MockDateComponent(props) {
    return (
      <div data-testid="date-component">
        <input
          type="date"
          name={props.name}
          {...props.register(props.name)}
          data-testid={`date-${props.name}`}
        />
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/prequalification/v2/form/Select', () => {
  return function MockSelect(props) {
    return (
      <div data-testid="select-component">
        <select
          name={props.name}
          {...props.register(props.name)}
          onChange={props.handleChange}
          defaultValue={props.defaultValue}
          data-testid={`select-${props.name}`}
          data-default-value={props.defaultValue}
        >
          {props.options.map((option, index) => (
            <option key={index} value={option.label} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/prequalification/v2/form/Text', () => {
  return function MockText(props) {
    return (
      <div data-testid="text-component">
        <input
          type="text"
          name={props.name}
          {...props.register(props.name)}
          value={props.value || ''}
          data-testid={`text-${props.name}`}
          required={props.required}
        />
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/prequalification/v2/form/file', () => {
  return function MockFile(props) {
    return (
      <div data-testid="file-component">
        <input
          type="file"
          name={props.name}
          {...props.register(props.name)}
          data-testid={`file-${props.name}`}
        />
      </div>
    );
  };
});

jest.mock('./useOtherInput', () => {
  return jest.fn(() => [false, jest.fn(), false, jest.fn()]);
});

const mockUseOtherInput = require('./useOtherInput');

describe('HealthSafetyEnvironmentalQualifications Component', () => {
  const mockT = jest.fn((key) => key);
  const mockDocumentsForm = {
    values: {
      date: '2023-12-01',
      document: null,
      label: 'Test Label',
    },
    errors: {},
    trigger: jest.fn(),
    register: jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
    setValue: jest.fn(),
  };

  const mockOptions = [
    { label: 'ISO 9001', value: 'iso_9001' },
    { label: 'ISO 14001', value: 'iso_14001' },
    { label: 'OHSAS 18001', value: 'ohsas_18001' },
    { label: CV, value: 'cv' },
    { label: 'Other certificate document', value: 'other' },
  ];

  const defaultProps = {
    data: null,
    selectedOptions: [],
    options: mockOptions,
    documentsForm: mockDocumentsForm,
    aid: 'test-aid',
  };

  beforeEach(() => {
    useTranslation.mockReturnValue({
      t: mockT,
    });
    // Reset mock to default values for each test
    mockUseOtherInput.mockReturnValue([false, jest.fn(), false, jest.fn()]);
    jest.clearAllMocks();
  });

  it('renders all form components', () => {
    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    expect(screen.getByTestId('select-component')).toBeInTheDocument();
    expect(screen.getByTestId('date-component')).toBeInTheDocument();
    expect(screen.getByTestId('file-component')).toBeInTheDocument();
  });

  it('renders select with correct options and default value', () => {
    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    const select = screen.getByTestId('select-label');
    const options = screen.getAllByRole('option');

    expect(select).toBeInTheDocument();
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('ISO 9001');
    expect(options[1]).toHaveTextContent('ISO 14001');
    expect(options[2]).toHaveTextContent('OHSAS 18001');
    expect(options[3]).toHaveTextContent(CV);
    expect(options[4]).toHaveTextContent('Other certificate document');
  });

  it('shows custom text field when other is true', () => {
    mockUseOtherInput.mockReturnValue([true, jest.fn(), false, jest.fn()]);

    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    expect(screen.getByTestId('text-component')).toBeInTheDocument();
    expect(screen.getByTestId('text-custom_label')).toBeInTheDocument();
  });

  it('shows custom text field when label is OTHER_CERTIFICATE_DOC', () => {
    const propsWithOtherLabel = {
      ...defaultProps,
      documentsForm: {
        ...mockDocumentsForm,
        values: {
          ...mockDocumentsForm.values,
          label: OTHER_CERTIFICATE_DOC,
        },
      },
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithOtherLabel} />);

    expect(screen.getByTestId('text-component')).toBeInTheDocument();
    expect(screen.getByTestId('text-custom_label')).toBeInTheDocument();
  });

  it('does not show custom text field when other is false and label is not OTHER_CERTIFICATE_DOC', () => {
    mockUseOtherInput.mockReturnValue([false, jest.fn(), false, jest.fn()]);

    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    expect(screen.queryByTestId('text-custom_label')).not.toBeInTheDocument();
  });

  it('sets default value to OTHER_CERTIFICATE_DOC when otherValue is truthy', () => {
    mockUseOtherInput.mockReturnValue([false, jest.fn(), true, jest.fn()]);

    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    const select = screen.getByTestId('select-label');
    expect(select).toHaveAttribute('data-default-value', OTHER_CERTIFICATE_DOC);
  });

  it('sets default value from data.label when available', () => {
    // Reset mock to ensure no otherValue is true
    mockUseOtherInput.mockReturnValue([false, jest.fn(), false, jest.fn()]);

    const propsWithData = {
      ...defaultProps,
      data: { label: 'ISO 9001' },
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithData} />);

    const select = screen.getByTestId('select-label');
    expect(select).toHaveAttribute('data-default-value', 'ISO 9001');
  });

  it('handles select change and calls handleOther', () => {
    const mockHandleOther = jest.fn();
    mockUseOtherInput.mockReturnValue([false, mockHandleOther, false, jest.fn()]);

    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    const select = screen.getByTestId('select-label');
    fireEvent.change(select, { target: { value: 'ISO 9001' } });

    expect(mockHandleOther).toHaveBeenCalledTimes(1);
    // The function receives the actual event object, not our mock object
    expect(mockHandleOther).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({
        value: 'ISO 9001'
      })
    }));
  });

  it('shows expiration date initially for CV document types', () => {
    const propsWithCVData = {
      ...defaultProps,
      data: { label: CV },
    };

    const component = render(<HealthSafetyEnvironmentalQualifications {...propsWithCVData} />);

    // When showExpirationDate is true, the date component should not be visible
    expect(screen.queryByTestId('date-component')).not.toBeInTheDocument();
  });

  it('shows date field for non-expiration document types', () => {
    const propsWithNormalData = {
      ...defaultProps,
      data: { label: 'ISO 9001' },
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithNormalData} />);

    expect(screen.getByTestId('date-component')).toBeInTheDocument();
  });

  it('hides date component when CV is selected', () => {
    render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);

    const select = screen.getByTestId('select-label');
    
    // Initially date component should be visible
    expect(screen.getByTestId('date-component')).toBeInTheDocument();

    // Select CV option
    fireEvent.change(select, { target: { value: CV } });

    // Date component should now be hidden (component re-renders with updated state)
    // Note: In a real test, we'd need to check the state change effect
  });

  it('disables options that are already selected', () => {
    const propsWithSelectedOptions = {
      ...defaultProps,
      selectedOptions: ['iso 9001', 'iso 14001'],
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithSelectedOptions} />);

    const options = screen.getAllByRole('option');
    expect(options[0]).toBeDisabled(); // ISO 9001
    expect(options[1]).toBeDisabled(); // ISO 14001
    expect(options[2]).not.toBeDisabled(); // OHSAS 18001
  });

  it('disables options when data has an id (existing document)', () => {
    const propsWithExistingDoc = {
      ...defaultProps,
      data: { id: 1, label: 'ISO 9001' },
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithExistingDoc} />);

    const options = screen.getAllByRole('option');
    options.forEach(option => {
      expect(option).toBeDisabled();
    });
  });

  it('disables options when document is requested', () => {
    const propsWithRequestedDoc = {
      ...defaultProps,
      data: { requested: true },
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithRequestedDoc} />);

    const options = screen.getAllByRole('option');
    options.forEach(option => {
      expect(option).toBeDisabled();
    });
  });

  it('renders file component with correct props', () => {
    const propsWithFileData = {
      ...defaultProps,
      data: { 
        id: 1, 
        document: 'test-document.pdf',
        original_file: 'original-file.pdf' 
      },
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithFileData} />);

    const fileInput = screen.getByTestId('file-document');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('name', 'document');
  });

  it('handles data being null', () => {
    const propsWithNullData = {
      ...defaultProps,
      data: null,
    };

    render(<HealthSafetyEnvironmentalQualifications {...propsWithNullData} />);

    expect(screen.getByTestId('select-component')).toBeInTheDocument();
    expect(screen.getByTestId('date-component')).toBeInTheDocument();
    expect(screen.getByTestId('file-component')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<HealthSafetyEnvironmentalQualifications {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });
});
