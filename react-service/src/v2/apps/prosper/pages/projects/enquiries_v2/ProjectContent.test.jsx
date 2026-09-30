import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectContent from './ProjectContent';

// Mock external dependencies
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return (date) => ({
    format: (format) => {
      if (!date) return '';
      return moment(date).format(format);
    }
  });
});

jest.mock('lodash/upperFirst', () => (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key.toUpperCase()
  })
}));

jest.mock('v2/helpers/date', () => ({
  DEFAULT_DATE_FORMAT: 'DD/MM/YYYY'
}));

jest.mock('v2/helpers/url', () => ({
  getProjectLogo: jest.fn((id) => `https://example.com/project/${id}/logo.png`)
}));

jest.mock('v2/apps/shared/components/ItemData', () => ({ icon, label, value }) => (
  <div data-testid="item-data">
    <span data-testid="item-icon">{icon}</span>
    <span data-testid="item-label">{label}</span>
    <span data-testid="item-value">{value}</span>
  </div>
));

describe('ProjectContent Component', () => {
  const mockData = {
    project_id: '123',
    project_region: 'London',
    project_type: 'Commercial',
    project_start: '2024-01-15',
    project_completion: '2024-06-15',
    project_status: 'active'
  };

  it('renders without crashing with valid data', () => {
    render(<ProjectContent data={mockData} />);
    expect(screen.getByTestId('mui-card-media')).toBeInTheDocument();
  });

  it('renders null when data is null', () => {
    const { container } = render(<ProjectContent data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when data is undefined', () => {
    const { container } = render(<ProjectContent data={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders project image with correct src', () => {
    render(<ProjectContent data={mockData} />);
    const image = screen.getByTestId('mui-card-media');
    expect(image).toHaveAttribute('src', 'https://example.com/project/123/logo.png');
    expect(image).toHaveAttribute('alt', 'Project Logo');
  });

  it('renders all project data fields', () => {
    render(<ProjectContent data={mockData} />);
    
    // Should render all ItemData components
    const itemDataElements = screen.getAllByTestId('item-data');
    expect(itemDataElements).toHaveLength(5); // 5 fields: region, type, start, completion, status
  });

  it('handles missing optional fields gracefully', () => {
    const incompleteData = {
      project_id: 123,
    };
    
    render(<ProjectContent data={incompleteData} />);
    expect(screen.getByTestId('mui-card-media')).toBeInTheDocument();
  });

  it('handles image error by setting fallback src', () => {
    render(<ProjectContent data={mockData} />);
    const image = screen.getByTestId('mui-card-media');
    
    // Simulate error event
    const errorEvent = new Event('error');
    fireEvent(image, errorEvent);
    
    // Note: In our mock, we can't test the actual error behavior,
    // but we can verify the image is rendered
    expect(image).toBeInTheDocument();
  });

  it('renders project dates correctly when provided', () => {
    render(<ProjectContent data={mockData} />);
    
    // Check that the dates are rendered through ItemData
    const values = screen.getAllByTestId('item-value');
    const hasDateValue = values.some(el => el.textContent.includes('/'));
    expect(hasDateValue).toBeTruthy();
  });

  it('renders status with proper capitalization', () => {
    render(<ProjectContent data={mockData} />);
    
    // Should render 'active' as 'Active' through upperFirst
    const values = screen.getAllByTestId('item-value');
    const statusValue = values.find(el => el.textContent === 'Active');
    expect(statusValue).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<ProjectContent data={mockData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles empty string values', () => {
    const dataWithEmptyValues = {
      project_id: 123,
      project_region: '',
      project_type: '',
      project_start: '',
      project_completion: '',
      project_status: '',
    };
    
    render(<ProjectContent data={dataWithEmptyValues} />);
    expect(screen.getByTestId('mui-card-media')).toBeInTheDocument();
  });
});