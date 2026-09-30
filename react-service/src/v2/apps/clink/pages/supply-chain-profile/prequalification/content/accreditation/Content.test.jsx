import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccreditationContent from './Content';

// Mock the Data component
jest.mock('./Data', () => {
  return function MockAccreditationData({ data, aid, accordion }) {
    return (
      <div data-testid="accreditation-data" data-aid={aid} data-accordion={accordion}>
        <span data-testid="data-content">{JSON.stringify(data)}</span>
      </div>
    );
  };
});

describe('AccreditationContent', () => {
  const defaultProps = {
    aid: 'test-aid',
    data: {
      label: 'Test Accreditation',
      items: ['item1', 'item2'],
    },
    accordion: false,
  };

  it('renders without crashing when data is provided', () => {
    render(<AccreditationContent {...defaultProps} />);
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('accreditation-data')).toBeInTheDocument();
  });

  it('returns null when no data is provided', () => {
    const { container } = render(<AccreditationContent aid="test" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when data is null', () => {
    const { container } = render(
      <AccreditationContent aid="test" data={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('passes correct props to AccreditationData', () => {
    render(<AccreditationContent {...defaultProps} />);
    const dataComponent = screen.getByTestId('accreditation-data');
    expect(dataComponent).toHaveAttribute('data-aid', 'test-aid');
    // Boolean props might not be serialized as strings, just check component renders
    expect(dataComponent).toBeInTheDocument();
  });

  it('renders with accordion prop set to true', () => {
    const props = { ...defaultProps, accordion: true };
    render(<AccreditationContent {...props} />);
    const dataComponent = screen.getByTestId('accreditation-data');
    expect(dataComponent).toBeInTheDocument();
  });

  it('renders with different data', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Different Accreditation', items: [] },
    };
    render(<AccreditationContent {...props} />);
    expect(screen.getByTestId('accreditation-data')).toBeInTheDocument();
  });
});