import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignOrder from './SignOrder';

// Mock the external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn()
}));

jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn()
}));

// Import the mocked modules to use in tests
import { fetchData } from 'services/helpers';
import { goToNewTab } from 'v2/helpers/url';

const mockDataWithSignature = {
  signatory: {
    can_sign: true
  },
  document: {
    order: {
      transaction_id: 'test-transaction-123',
      order_template_id: 'test-template-456'
    }
  }
};

const mockDataWithoutSignature = {
  signatory: {
    can_sign: false
  },
  document: {
    order: {
      transaction_id: 'test-transaction-123',
      order_template_id: 'test-template-456'
    }
  }
};

const mockDataIncomplete = {
  signatory: {
    can_sign: true
  },
  document: {
    order: {
      transaction_id: null,
      order_template_id: 'test-template-456'
    }
  }
};

describe('SignOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sign order button when user can sign and has required data', () => {
    render(<SignOrder data={mockDataWithSignature} />);
    expect(screen.getByText('sign-order')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('does not render when user cannot sign', () => {
    render(<SignOrder data={mockDataWithoutSignature} />);
    expect(screen.queryByText('sign-order')).not.toBeInTheDocument();
  });

  test('does not render when transaction_id is missing', () => {
    render(<SignOrder data={mockDataIncomplete} />);
    expect(screen.queryByText('sign-order')).not.toBeInTheDocument();
  });

  test('does not render when order_template_id is missing', () => {
    const dataWithoutTemplate = {
      signatory: {
        can_sign: true
      },
      document: {
        order: {
          transaction_id: 'test-transaction-123',
          order_template_id: null
        }
      }
    };
    render(<SignOrder data={dataWithoutTemplate} />);
    expect(screen.queryByText('sign-order')).not.toBeInTheDocument();
  });

  test('does not render when data is null', () => {
    render(<SignOrder data={null} />);
    expect(screen.queryByText('sign-order')).not.toBeInTheDocument();
  });

  test('does not render when data is undefined', () => {
    render(<SignOrder />);
    expect(screen.queryByText('sign-order')).not.toBeInTheDocument();
  });

  test('does not render when data is empty object', () => {
    render(<SignOrder data={{}} />);
    expect(screen.queryByText('sign-order')).not.toBeInTheDocument();
  });

  test('calls fetchData and goToNewTab on successful button click', async () => {
    const mockResponse = {
      success: true,
      redirect: 'https://example.com/sign'
    };
    fetchData.mockResolvedValue(mockResponse);

    render(<SignOrder data={mockDataWithSignature} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        'enquiries',
        {},
        'test-transaction-123/sign/test-template-456/'
      );
    });

    await waitFor(() => {
      expect(goToNewTab).toHaveBeenCalledWith('https://example.com/sign');
    });
  });

  test('handles fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchData.mockRejectedValue(new Error('Network error'));

    render(<SignOrder data={mockDataWithSignature} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Network error'));
    });

    expect(goToNewTab).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('does not call goToNewTab when success is false', async () => {
    const mockResponse = {
      success: false,
      redirect: 'https://example.com/sign'
    };
    fetchData.mockResolvedValue(mockResponse);

    render(<SignOrder data={mockDataWithSignature} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
    });

    expect(goToNewTab).not.toHaveBeenCalled();
  });

  test('does not call goToNewTab when redirect is missing', async () => {
    const mockResponse = {
      success: true,
      redirect: null
    };
    fetchData.mockResolvedValue(mockResponse);

    render(<SignOrder data={mockDataWithSignature} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
    });

    expect(goToNewTab).not.toHaveBeenCalled();
  });

  test('button has correct styling properties', () => {
    render(<SignOrder data={mockDataWithSignature} />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('variant', 'contained');
    expect(button).toHaveAttribute('color', 'primary');
  });
});