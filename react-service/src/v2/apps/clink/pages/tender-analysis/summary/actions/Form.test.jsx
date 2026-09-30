import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from './Form';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getDocCreatorUrl: jest.fn((id, type, tid) => `http://example.com/doc/${type}/${id}?tid=${tid}`),
}));

// Mock Relay service
jest.mock('v1/global/services/Relay', () => {
  return jest.fn().mockImplementation(() => ({
    post: jest.fn(),
  }));
});

// Mock console.error to avoid error logs in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Form', () => {
  const mockQuoteInfo = {
    id: 123,
    tender_id: 456,
    subcontractor: {
      id: 789,
      name: 'Test Subcontractor',
    },
  };

  const mockOrderTemplates = [
    { id: 1, name: 'Standard Order Template' },
    { id: 2, name: 'Express Order Template with Very Long Name That Should Be Truncated' },
    { id: 3, name: 'Premium Order Template' },
  ];

  const mockSetOpen = jest.fn();
  const Relay = require('v1/global/services/Relay');
  const { goTo, getDocCreatorUrl } = require('v2/helpers/url');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with template selector', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'continue' })).toBeInTheDocument();
  });

  it('displays all order templates in select dropdown', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    // Templates are always visible in our mock
    expect(screen.getByText('Standard Order Template')).toBeInTheDocument();
    expect(screen.getByText('Express Order Template with Very Long Name That Should Be Truncated')).toBeInTheDocument();
    expect(screen.getByText('Premium Order Template')).toBeInTheDocument();
  });

  it('continue button is disabled when no template is selected', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    const continueButton = screen.getByRole('button', { name: 'continue' });
    expect(continueButton).toBeDisabled();
  });

  it('cancel button calls setOpen with false', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'cancel' });
    fireEvent.click(cancelButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('handles missing quoteInfo', () => {
    render(
      <Form
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'continue' })).toBeDisabled();
  });

  it('handles empty orderTemplates', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={[]}
        setOpen={mockSetOpen}
      />
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    
    // Should not have any template options
    expect(screen.queryByText('Standard Order Template')).not.toBeInTheDocument();
  });

  it('renders tooltips for template names', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    // Check that tooltips are present with template names
    const tooltips = screen.getAllByText(/Order Template/);
    expect(tooltips.length).toBeGreaterThan(0);
    expect(screen.getByText('Express Order Template with Very Long Name That Should Be Truncated')).toBeInTheDocument();
  });

  it('renders form control and select elements', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
    expect(screen.getByTestId('mui-select')).toBeInTheDocument();
  });

  it('renders all template menu items with correct values', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    const menuItems = screen.getAllByTestId('mui-menu-item');
    expect(menuItems).toHaveLength(3);
    
    expect(menuItems[0]).toHaveAttribute('value', '1');
    expect(menuItems[1]).toHaveAttribute('value', '2');
    expect(menuItems[2]).toHaveAttribute('value', '3');
  });

  it('renders typography components with template names', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    const typographyElements = screen.getAllByTestId('mui-typography');
    expect(typographyElements).toHaveLength(3);
    
    expect(screen.getByText('Standard Order Template')).toBeInTheDocument();
    expect(screen.getByText('Premium Order Template')).toBeInTheDocument();
  });

  it('renders grid layout for buttons', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        setOpen={mockSetOpen}
      />
    );

    const grids = screen.getAllByTestId('grid2');
    expect(grids.length).toBeGreaterThan(1); // Should have container and item grids
  });

  it('handles default props correctly', () => {
    render(<Form />);
    
    // Should render basic structure with defaults
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'continue' })).toBeDisabled();
  });

  it('handles null orderTemplates', () => {
    render(
      <Form
        quoteInfo={mockQuoteInfo}
        orderTemplates={null}
        setOpen={mockSetOpen}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByText('Standard Order Template')).not.toBeInTheDocument();
  });
});