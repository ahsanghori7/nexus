import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from './index';

// Mock the dependencies
jest.mock('v2/helpers/php-globals', () => {
  return jest.fn(() => ({
    data: {
      project: 'Test Project Name',
      client: 'Test Client Company',
      email: 'test@example.com',
      value: '£50,000',
      completion_date: '2024-12-31',
      description_of_works: 'Test description of works for the project'
    }
  }));
});

jest.mock('react-router-dom', () => ({
  useParams: () => ({
    token: 'test-token-123'
  })
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'work-reference-approval': 'Work Reference Approval',
        'enquiries-table-column-project': 'Project',
        'enquiries-table-column-contractor': 'Contractor',
        'email': 'Email',
        'approx-value': 'Approximate Value',
        'approx-completion-date': 'Approximate Completion Date',
        'work-description': 'Work Description',
        'summary': 'Summary',
        'approve': 'Approve'
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}));

// Mock Container component
jest.mock('v2/apps/prosper/pages/sign-up/shared/Container', () => {
  return function Container({ children, extra, footer, name }) {
    return (
      <div 
        data-testid="mock-container" 
        data-footer={footer} 
        data-name={name}
        {...extra}
      >
        {children}
      </div>
    );
  };
});

// Mock InputText component
jest.mock('v2/apps/prosper/pages/sign-up/shared/InputText', () => {
  return function InputText({ id, name, label, value, readOnly, type, placeholder }) {
    return (
      <div data-testid={`input-text-${id}`}>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={name}
          type={type}
          value={value || ''}
          readOnly={readOnly}
          placeholder={placeholder}
          data-testid={`input-${id}`}
        />
      </div>
    );
  };
});

// Mock Title component
jest.mock('v2/apps/prosper/pages/sign-up/shared/Title', () => {
  return function Title({ title, sx }) {
    return <h1 data-testid="title" style={sx}>{title}</h1>;
  };
});

// Mock ThankYouReference component
jest.mock('./ThankYouReference', () => {
  return function ThankYouReference() {
    return <div data-testid="thank-you-reference">Thank you component</div>;
  };
});

// Mock moment
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return (date) => {
    if (date === '2024-12-31') {
      return {
        format: (format) => {
          if (format === 'Do MMM YYYY') {
            return '31st Dec 2024';
          }
          return date;
        }
      };
    }
    return moment(date);
  };
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock global variables
global.BASE_URLS = {
  PROSPER: 'https://prosper.example.com',
  REFERENCE: '/reference'
};

global.RELAY = {
  HOST: '/api',
  VERSION: 'v1'
};

describe('Form (references-approval index)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    render(<Form />);
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
  });

  test('displays form title', () => {
    render(<Form />);
    expect(screen.getByTestId('title')).toHaveTextContent('Work Reference Approval');
  });

  test('displays all read-only input fields with correct values', () => {
    render(<Form />);
    
    // Check project field
    expect(screen.getByTestId('input-project')).toHaveValue('Test Project Name');
    expect(screen.getByTestId('input-project')).toHaveAttribute('readOnly');
    
    // Check client field
    expect(screen.getByTestId('input-client')).toHaveValue('Test Client Company');
    expect(screen.getByTestId('input-client')).toHaveAttribute('readOnly');
    
    // Check email field
    expect(screen.getByTestId('input-email')).toHaveValue('test@example.com');
    expect(screen.getByTestId('input-email')).toHaveAttribute('readOnly');
    
    // Check value field
    expect(screen.getByTestId('input-value')).toHaveValue('£50,000');
    expect(screen.getByTestId('input-value')).toHaveAttribute('readOnly');
    
    // Check completion date field (formatted)
    expect(screen.getByTestId('input-completion_date')).toHaveValue('31st Dec 2024');
    expect(screen.getByTestId('input-completion_date')).toHaveAttribute('readOnly');
  });

  test('displays work description textarea as read-only', () => {
    render(<Form />);
    
    const workDescriptionTextarea = screen.getByDisplayValue('Test description of works for the project');
    expect(workDescriptionTextarea).toBeInTheDocument();
    expect(workDescriptionTextarea).toHaveAttribute('readonly');
  });

  test('displays editable summary textarea', () => {
    render(<Form />);
    
    // Find the summary textarea by id since it's the one without readonly
    const summaryTextarea = screen.getByDisplayValue('');
    expect(summaryTextarea).toBeInTheDocument();
    expect(summaryTextarea).toHaveAttribute('id', 'summary');
    expect(summaryTextarea).not.toHaveAttribute('readonly');
  });

  test('allows typing in summary textarea', () => {
    render(<Form />);
    
    // Find summary textarea by id since it's empty and editable
    const summaryTextarea = screen.getByDisplayValue('');
    
    fireEvent.change(summaryTextarea, { target: { value: 'Test summary content' } });
    
    expect(summaryTextarea).toHaveValue('Test summary content');
  });

  test('displays approve button', () => {
    render(<Form />);
    
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    expect(approveButton).toBeInTheDocument();
  });

  test('approve button is disabled when data is missing', () => {
    // Mock PHPGlobals to return incomplete data
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue({
      data: {
        project: 'Test Project'
        // Missing other required fields
      }
    });

    render(<Form />);
    
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    expect(approveButton).toBeDisabled();
  });

  test('handles form submission successfully', async () => {
    // Reset mock to return complete data
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue({
      data: {
        project: 'Test Project Name',
        client: 'Test Client Company',
        email: 'test@example.com',
        value: '£50,000',
        completion_date: '2024-12-31',
        description_of_works: 'Test description of works for the project'
      }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<Form />);
    
    // Fill in summary
    const summaryTextarea = screen.getByDisplayValue('');
    fireEvent.change(summaryTextarea, { target: { value: 'Test summary' } });
    
    // Submit form
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    expect(approveButton).not.toBeDisabled(); // Should not be disabled with complete data
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByTestId('thank-you-reference')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://prosper.example.com/api/v1/reference/activate/test-token-123',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: 'Test Project Name',
          client: 'Test Client Company',
          email: 'test@example.com',
          value: '£50,000',
          completion_date: '2024-12-31',
          description_of_works: 'Test description of works for the project',
          summary: 'Test summary'
        })
      }
    );
  });

  test('handles form submission error', async () => {
    // Reset mock to return complete data  
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue({
      data: {
        project: 'Test Project Name',
        client: 'Test Client Company',
        email: 'test@example.com',
        value: '£50,000',
        completion_date: '2024-12-31',
        description_of_works: 'Test description of works for the project'
      }
    });

    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Form />);
    
    // Fill in summary
    const summaryTextarea = screen.getByDisplayValue('');
    fireEvent.change(summaryTextarea, { target: { value: 'Test summary' } });
    
    // Submit form
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    expect(approveButton).not.toBeDisabled(); // Should not be disabled with complete data
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('thank-you-reference')).not.toBeInTheDocument();
  });

  test('handles missing PHPGlobals data gracefully', () => {
    // Mock PHPGlobals to return null
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue(null);

    render(<Form />);
    
    // Should still render the form
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
    
    // But approve button should be disabled
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    expect(approveButton).toBeDisabled();
  });

  test('handles missing completion date gracefully', () => {
    // Mock PHPGlobals to return data without completion_date
    const mockPHPGlobals = require('v2/helpers/php-globals');
    mockPHPGlobals.mockReturnValue({
      data: {
        project: 'Test Project Name',
        client: 'Test Client Company',
        email: 'test@example.com',
        value: '£50,000',
        description_of_works: 'Test description of works'
        // completion_date is missing
      }
    });

    render(<Form />);
    
    // Completion date input should be empty
    expect(screen.getByTestId('input-completion_date')).toHaveValue('');
  });

  test('form shows initial state when not submitted and no error', () => {
    render(<Form />);
    
    // Should show the form
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toBeInTheDocument();
    
    // Should not show thank you or error messages
    expect(screen.queryByTestId('thank-you-reference')).not.toBeInTheDocument();
    expect(screen.queryByText('Error: Something went wrong')).not.toBeInTheDocument();
  });
});