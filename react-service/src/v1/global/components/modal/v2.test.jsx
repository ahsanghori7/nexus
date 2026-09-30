import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './v2';

describe('Modal Component', () => {
  test('should open modal when the button is clicked', () => {
    render(
      <Modal
        title="Test Modal"
        ShowButton={({ handleClick }) => (
          <button onClick={handleClick}>Open Modal</button>
        )}
      />
    );

    // Verify the modal is not open initially
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    // Click to open the modal
    fireEvent.click(screen.getByText(/Open Modal/i));

    // Verify modal is now open
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  test('should not close modal when clicking backdrop if backdrop is false', () => {
    render(
      <Modal
        title="Test Modal"
        backdrop={false}
        ShowButton={({ handleClick }) => (
          <button onClick={handleClick}>Open Modal</button>
        )}
      />
    );

    // Open the modal
    fireEvent.click(screen.getByText(/Open Modal/i));

    // Click on the backdrop (Dialog content area)
    fireEvent.click(screen.getByTestId('modal-content'));

    // Modal should remain open because backdrop is disabled
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  test('should render modal with subtitle', () => {
    render(
      <Modal
        title="Test Modal"
        subtitle="Test Subtitle"
        ShowButton={({ handleClick }) => (
          <button onClick={handleClick}>Open Modal</button>
        )}
      />
    );

    // Open the modal
    fireEvent.click(screen.getByText(/Open Modal/i));

    // Check for subtitle in the modal
    expect(screen.getByText(/Test Subtitle/i)).toBeInTheDocument();
  });

  test('should render modal with children', () => {
    render(
      <Modal
        title="Test Modal"
        ShowButton={({ handleClick }) => (
          <button onClick={handleClick}>Open Modal</button>
        )}
      >
        <div data-testid="modal-child">Modal Content</div>
      </Modal>
    );

    // Open the modal
    fireEvent.click(screen.getByText(/Open Modal/i));

    // Check if modal contains children
    expect(screen.getByTestId('modal-child')).toBeInTheDocument();
  });
});
