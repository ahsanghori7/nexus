import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ConfirmModal from 'v1/global/components/ConfirmModal';

// Mock the ConfirmModal component
jest.mock('v1/global/components/ConfirmModal', () => {
  return jest.fn(({ title, subtitle, OpenModal, handleSubmit }) => {
    const handleClick = () => {
      handleSubmit({ setShow: jest.fn() });
    };

    return (
      <div data-testid="confirm-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-subtitle">{subtitle}</div>
        <OpenModal data-testid="delete-button" onClick={handleClick} />
        <button data-testid="confirm-button" onClick={handleClick}>Confirm</button>
      </div>
    );
  });
});

// Mock DeleteButton component
jest.mock('./DeleteButton', () => {
  return function MockDeleteButton(props) {
    return <button {...props}>Delete</button>;
  };
});

describe('DeleteConfirmationModal', () => {
  const mockHandleUpdateAttendance = jest.fn();
  const defaultProps = {
    uniqueKey: 'test-key',
    fullData: [
      { id: '1', description: 'Item 1' },
      { id: '2', description: 'Item 2' },
      { title: 'Section', id: '3' },
      { id: '4', description: 'Item 3' },
    ],
    data: { id: '2', description: 'Item 2' },
    did: 'document123',
    handleUpdateAttendance: mockHandleUpdateAttendance,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct props', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    // Check that ConfirmModal was called with right props
    expect(ConfirmModal).toHaveBeenCalledWith(
      expect.objectContaining({
        data: defaultProps.data,
        title: 'Are you sure want to delete this row?',
        subtitle: 'This action will not be reversible.',
        OpenModal: expect.any(Function),
        handleSubmit: expect.any(Function)
      }),
      {}
    );
  });

  test('renders section delete modal with correct title and subtitle', () => {
    render(<DeleteConfirmationModal {...defaultProps} section />);

    // Check section message in the title and subtitle
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Are you sure want to delete this section?');
    expect(screen.getByTestId('modal-subtitle')).toHaveTextContent('This will remove the section and all of its subitems. This action will not be reversible.');
  });

  test('calls handleUpdateAttendance with correct data on normal row deletion', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    // Click the confirm button
    fireEvent.click(screen.getByTestId('confirm-button'));

    // Check that handleUpdateAttendance was called with the right params
    expect(mockHandleUpdateAttendance).toHaveBeenCalledWith(
      'document123',
      [
        { id: '1', description: 'Item 1' },
        { title: 'Section', id: '3' },
        { id: '4', description: 'Item 3' },
      ]
    );
  });

  test('handles section deletion correctly', () => {
    const sectionProps = {
      ...defaultProps,
      section: true,
      data: { id: '3', description: 'Section' },
    };

    render(<DeleteConfirmationModal {...sectionProps} />);

    // Click the confirm button
    fireEvent.click(screen.getByTestId('confirm-button'));

    // Verify correct method call
    expect(mockHandleUpdateAttendance).toHaveBeenCalled();
  });

  test('does not call handleUpdateAttendance when data is null', () => {
    render(<DeleteConfirmationModal {...defaultProps} data={null} />);

    // Click the confirm button
    fireEvent.click(screen.getByTestId('confirm-button'));

    // Verify method was not called
    expect(mockHandleUpdateAttendance).not.toHaveBeenCalled();
  });

  test('renders DeleteButton as trigger', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
