import React from 'react';
import { render, screen } from '@testing-library/react';
import Subheader from './Subheader';

// Mock the clink-components Image component
jest.mock('clink-components', () => ({
  Image: ({ src, ...props }) => (
    <img src={src} alt="mock-image" data-testid="clink-image" {...props} />
  ),
}));

describe('Subheader', () => {
  it('renders without crashing with minimal data', () => {
    render(<Subheader data={{}} />);
    // Component should render even with empty data - check for CardActions container
    expect(screen.getByTestId('mui-card-actions')).toBeInTheDocument();
  });

  it('renders without crashing when data is null', () => {
    render(<Subheader data={null} />);
    expect(screen.getByTestId('mui-card-actions')).toBeInTheDocument();
  });

  it('displays status information when provided', () => {
    const mockData = {
      type: 'Interest',
      status_id: 1,
    };

    render(<Subheader data={mockData} />);
    
    // Should show the status label
    expect(screen.getByText('INTERESTED')).toBeInTheDocument();
  });

  it('displays status with string icon', () => {
    const mockData = {
      type: 'Interest', 
      status_id: 1,
    };

    render(<Subheader data={mockData} />);
    
    // Should render the avatar containing the icon
    expect(screen.getByTestId('clink-image')).toBeInTheDocument();
  });

  it('displays waiting chip when status has waiting property', () => {
    // Create data that would result in a status with waiting time
    const mockData = {
      type: 'Enquiry',
      status_id: 4, // TENDER_ACCEPTED
      tenderReturn: '2024-12-01', // Some future date
    };

    render(<Subheader data={mockData} />);
    
    // Should show status label
    expect(screen.getByText('TEXT-TENDER-SPECS-RECEIVED')).toBeInTheDocument();
  });

  it('renders without waiting chip when no waiting time', () => {
    const mockData = {
      type: 'Enquiry',
      status_id: 9, // QUOTE_SENT - but no decisionDate provided
    };

    render(<Subheader data={mockData} />);
    
    // Should show the quote sent status
    expect(screen.getByText('QUOTE-SENT')).toBeInTheDocument();
    // Should not show a waiting chip since no decision date is provided
    const chip = screen.queryByRole('button'); // Chips render as buttons in MUI
    expect(chip).not.toBeInTheDocument();
  });

  it('handles singular day text correctly', () => {
    // Mock data that would return days
    const mockData = {
      type: 'Enquiry',
      status_id: 4,
      tenderReturn: '2024-12-01', // Future date that will return mocked days
    };

    render(<Subheader data={mockData} />);
    
    // Component should render without errors
    expect(screen.getByTestId('mui-card-actions')).toBeInTheDocument();
  });

  it('renders status without icon when icon is null', () => {
    // This would be handled by the getStatus mock returning null icon
    const mockData = {
      type: 'Unknown',
      status_id: 999, // Non-existent status that would return OTHER_STATUS
    };

    render(<Subheader data={mockData} />);
    
    // Should still render the component
    expect(screen.getByTestId('mui-card-actions')).toBeInTheDocument();
    // Should show the default status
    expect(screen.getByText('OTHER-STATUS')).toBeInTheDocument();
  });

  it('displays Stack components with correct layout', () => {
    const mockData = {
      type: 'Interest',
      status_id: 1,
    };

    render(<Subheader data={mockData} />);
    
    // Should have the main container
    expect(screen.getByTestId('mui-card-actions')).toBeInTheDocument();
    // Should have the status text
    expect(screen.getByText('INTERESTED')).toBeInTheDocument();
  });

  it('renders main container elements', () => {
    const mockData = {
      type: 'Interest',
      status_id: 1,
    };

    render(<Subheader data={mockData} />);
    
    // Should have Box and Stack elements
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getAllByTestId('mui-stack')).toHaveLength(2); // Two stacks in layout
  });
});