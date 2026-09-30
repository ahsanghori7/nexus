import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Interest from './Interest';
import { getProjectLogo, checkIfImageExists } from 'v2/helpers/url';

// Mock the helpers
jest.mock('v2/helpers/url');

describe('Interest', () => {
  const mockItem = {
    id: 'test-project-123',
    title: 'Test Project',
    description: 'Test project description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getProjectLogo.mockReturnValue('mocked-project-logo-url');
    checkIfImageExists.mockImplementation((url, callback) => {
      callback(true); // Simulate image exists
    });
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<Interest item={mockItem} />);
    
    expect(getByTestId('registered-card')).toBeInTheDocument();
  });

  it('passes correct props to RegisteredCard', () => {
    const { getByTestId } = render(<Interest item={mockItem} version="v2" />);
    
    const registeredCard = getByTestId('registered-card');
    expect(registeredCard).toHaveAttribute('data-version', 'v2');
    expect(getByTestId('card-id')).toHaveTextContent(mockItem.id);
  });

  it('calls getProjectLogo with correct item id', () => {
    render(<Interest item={mockItem} />);
    
    expect(getProjectLogo).toHaveBeenCalledWith(mockItem.id);
  });

  it('calls checkIfImageExists to verify image', () => {
    render(<Interest item={mockItem} />);
    
    expect(checkIfImageExists).toHaveBeenCalledWith(
      'mocked-project-logo-url',
      expect.any(Function)
    );
  });

  it('uses project logo when image exists', async () => {
    checkIfImageExists.mockImplementation((url, callback) => {
      callback(true); // Image exists
    });
    
    const { getByTestId } = render(<Interest item={mockItem} />);
    
    await waitFor(() => {
      expect(getByTestId('card-image')).toHaveTextContent('mocked-project-logo-url');
    });
  });

  it('uses default image when project logo does not exist', async () => {
    checkIfImageExists.mockImplementation((url, callback) => {
      callback(false); // Image does not exist
    });
    
    const { getByTestId } = render(<Interest item={mockItem} />);
    
    await waitFor(() => {
      // Should use the prosperPackagesDefault from CONSTANTS
      expect(getByTestId('card-image')).not.toHaveTextContent('mocked-project-logo-url');
    });
  });

  it('handles v1 version prop', () => {
    const { getByTestId } = render(<Interest item={mockItem} version="v1" />);
    
    expect(getByTestId('registered-card')).toHaveAttribute('data-version', 'v1');
  });

  it('handles v2 version prop', () => {
    const { getByTestId } = render(<Interest item={mockItem} version="v2" />);
    
    expect(getByTestId('registered-card')).toHaveAttribute('data-version', 'v2');
  });

  it('defaults to v1 when no version specified', () => {
    const { getByTestId } = render(<Interest item={mockItem} />);
    
    expect(getByTestId('registered-card')).toHaveAttribute('data-version', 'v1');
  });

  it('matches snapshot', () => {
    const { container } = render(<Interest item={mockItem} version="v1" />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});