import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Others from './Others';
import { mockUseUpdateProject } from 'v2/apps/clink/pages/pmp/project-details/mocks/project-details-setup';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

describe('Others Component', () => {
  const defaultProps = {
    useUpdateProject: mockUseUpdateProject,
  };

  it('renders without crashing', () => {
    render(<Others {...defaultProps} />);
    expect(screen.getByText('others')).toBeInTheDocument();
  });

  it('renders GIA input field with correct value', () => {
    render(<Others {...defaultProps} />);

    // Use display value since this is a number input
    const giaInput = screen.getByDisplayValue('500');
    expect(giaInput).toBeInTheDocument();
    expect(giaInput.getAttribute('type')).toBe('number');
  });

  it('calls setGia when input value changes', () => {
    const setGiaMock = jest.fn();
    const props = {
      useUpdateProject: {
        ...mockUseUpdateProject,
        useGia: ['500', setGiaMock],
      },
    };

    render(<Others {...props} />);

    const giaInput = screen.getByDisplayValue('500');
    fireEvent.change(giaInput, { target: { value: '750' } });

    expect(setGiaMock).toHaveBeenCalledWith('750');
  });

  it('handles empty useUpdateProject prop gracefully', () => {
    const emptyProps = {
      useUpdateProject: {
        useGia: ['', jest.fn()],
      },
    };

    render(<Others {...emptyProps} />);
    expect(screen.getByText('others')).toBeInTheDocument();
  });

  it('renders the component structure correctly', () => {
    const { container } = render(<Others {...defaultProps} />);

    // Check for the typography header
    expect(screen.getByText('others')).toBeInTheDocument();

    // Check that we have an input field with number type
    const numberInput = container.querySelector('input[type="number"]');
    expect(numberInput).toBeInTheDocument();
  });
});
