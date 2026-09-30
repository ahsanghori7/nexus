import React from 'react';
import { render, screen } from '@testing-library/react';
import InsuranceContent from './Content';

// Mock the Data component
jest.mock('./Data', () => {
  return function MockInsuranceData(props) {
    return (
      <div data-testid="insurance-data">
        <div data-testid="country">{props.country}</div>
        <div data-testid="aid">{props.aid}</div>
        <div data-testid="data">{JSON.stringify(props.data)}</div>
      </div>
    );
  };
});

describe('InsuranceContent', () => {
  const mockData = {
    label: 'Professional Liability Insurance',
    section: 'liability',
    amount: '$1,000,000',
  };

  it('renders without crashing', () => {
    render(<InsuranceContent data={mockData} aid="test-aid" country="US" />);
    
    expect(screen.getByText('Professional Liability Insurance')).toBeInTheDocument();
    expect(screen.getByTestId('insurance-data')).toBeInTheDocument();
  });

  it('renders with country and aid props passed to InsuranceData', () => {
    render(<InsuranceContent data={mockData} aid="test-aid-123" country="CA" />);
    
    expect(screen.getByTestId('country')).toHaveTextContent('CA');
    expect(screen.getByTestId('aid')).toHaveTextContent('test-aid-123');
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
  });

  it('renders with empty label', () => {
    const dataWithoutLabel = {
      section: 'liability',
      amount: '$1,000,000',
    };
    
    render(<InsuranceContent data={dataWithoutLabel} aid="test-aid" country="US" />);
    
    expect(screen.getByTestId('insurance-data')).toBeInTheDocument();
  });

  it('renders insurance icon image', () => {
    render(<InsuranceContent data={mockData} aid="test-aid" country="US" />);
    
    expect(screen.getByTestId('mui-card-media')).toBeInTheDocument();
  });

  it('returns null when data is null', () => {
    const { container } = render(<InsuranceContent data={null} aid="test-aid" country="US" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('returns null when data is undefined', () => {
    const { container } = render(<InsuranceContent data={undefined} aid="test-aid" country="US" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('returns null when data label is "Other" and no section', () => {
    const otherData = {
      label: 'Other',
    };
    
    const { container } = render(<InsuranceContent data={otherData} aid="test-aid" country="US" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders when data label is "Other" but has section', () => {
    const otherDataWithSection = {
      label: 'Other',
      section: 'custom-section',
    };
    
    render(<InsuranceContent data={otherDataWithSection} aid="test-aid" country="US" />);
    
    expect(screen.getByText('Other')).toBeInTheDocument();
    expect(screen.getByTestId('insurance-data')).toBeInTheDocument();
  });

  it('renders without aid prop', () => {
    render(<InsuranceContent data={mockData} country="US" />);
    
    expect(screen.getByText('Professional Liability Insurance')).toBeInTheDocument();
    expect(screen.getByTestId('insurance-data')).toBeInTheDocument();
  });

  it('renders without country prop', () => {
    render(<InsuranceContent data={mockData} aid="test-aid" />);
    
    expect(screen.getByText('Professional Liability Insurance')).toBeInTheDocument();
    expect(screen.getByTestId('insurance-data')).toBeInTheDocument();
  });
});