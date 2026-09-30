import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Progress from './Progress';

// Mock the external dependencies
jest.mock('v2/helpers/status/enquiries', () => ({
  getStatus: jest.fn(() => ({
    index: 1,
    status: 'IN_PROGRESS'
  })),
  getProgress: jest.fn(() => [
    {
      label: 'step-1',
      icon: 'test-icon.png',
      dark: 'test-dark-icon.png',
      bg: '#000000'
    },
    {
      label: 'step-2', 
      icon: 'test-icon2.png',
      dark: 'test-dark-icon2.png',
      bg: '#111111'
    }
  ])
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key.toUpperCase()
  })
}));

describe('Progress Component', () => {
  const mockData = {
    status_id: 1,
    type: 'enquiry'
  };

  it('renders without crashing', () => {
    render(<Progress data={mockData} />);
    expect(screen.getByTestId('enquiry-progress')).toBeInTheDocument();
  });

  it('renders with null data gracefully', () => {
    render(<Progress data={null} />);
    // Should not render stepper when data is null/falsy
    expect(screen.queryByTestId('enquiry-progress')).not.toBeInTheDocument();
  });

  it('renders with empty data object', () => {
    render(<Progress data={{}} />);
    expect(screen.getByTestId('enquiry-progress')).toBeInTheDocument();
  });

  it('renders unsuccessful status message when status is UNSUCCESSFUL', () => {
    // Mock getStatus to return UNSUCCESSFUL status
    const { getStatus } = require('v2/helpers/status/enquiries');
    getStatus.mockReturnValueOnce({
      index: 2,
      status: 'UNSUCCESSFUL'
    });

    render(<Progress data={mockData} />);
    expect(screen.getByText('UNSUCCESSFUL-TEXT')).toBeInTheDocument();
  });

  it('does not render unsuccessful message for other statuses', () => {
    render(<Progress data={mockData} />);
    expect(screen.queryByText('UNSUCCESSFUL-TEXT')).not.toBeInTheDocument();
  });

  it('renders step labels correctly', () => {
    render(<Progress data={mockData} />);
    
    // Should render the step labels from our mock
    expect(screen.getByText('STEP-1')).toBeInTheDocument();
    expect(screen.getByText('STEP-2')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<Progress data={mockData} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});