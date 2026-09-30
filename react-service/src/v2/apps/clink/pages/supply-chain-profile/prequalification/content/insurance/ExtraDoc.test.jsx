import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExtraDoc from './ExtraDoc';

// Mock the Wrapper component
jest.mock('./Wrapper', () => {
  return function MockWrapper({ children, data, aid, extra }) {
    return (
      <div data-testid="wrapper" data-aid={aid} data-extra={extra}>
        <span data-testid="wrapper-data">{JSON.stringify(data)}</span>
        {children}
      </div>
    );
  };
});

describe('ExtraDoc', () => {
  const defaultProps = {
    aid: 'test-aid',
    item: {
      label: 'Test Document',
      original_file: null,
    },
    data: {
      label: 'Test Data Label',
    },
  };

  it('renders without crashing', () => {
    render(<ExtraDoc {...defaultProps} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
  });

  it('renders tooltip with item label', () => {
    render(<ExtraDoc {...defaultProps} />);
    const tooltip = screen.getByTestId('mui-tooltip');
    expect(tooltip).toHaveAttribute('data-title', 'Test Document');
  });

  it('renders with success color when original_file exists', () => {
    const props = {
      ...defaultProps,
      item: {
        ...defaultProps.item,
        original_file: 'some-file.pdf',
      },
    };
    render(<ExtraDoc {...props} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
  });

  it('renders with default color when no original_file', () => {
    render(<ExtraDoc {...defaultProps} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
  });

  it('passes correct props to Wrapper', () => {
    render(<ExtraDoc {...defaultProps} />);
    const wrapper = screen.getByTestId('wrapper');
    expect(wrapper).toHaveAttribute('data-aid', 'test-aid');
    expect(wrapper).toHaveAttribute('data-extra', 'true');
  });

  it('handles missing props gracefully', () => {
    render(<ExtraDoc aid="test" item={{}} data={{}} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
  });
});
