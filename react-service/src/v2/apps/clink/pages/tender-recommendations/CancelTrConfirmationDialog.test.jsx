import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import CancelTrConfirmationDialog from './CancelTrConfirmationDialog';

// Mock translation hook to return the key itself
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

describe('CancelTrConfirmationDialog', () => {
  it('does not render dialog content when open is false', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    const { container } = render(
      <CancelTrConfirmationDialog
        open={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    // No title/description/buttons should appear
    expect(screen.queryByText('cancel-tr')).not.toBeInTheDocument();
    expect(
      screen.queryByText('cancel-tr-dialog-description'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('keep-recommendation')).not.toBeInTheDocument();
    // No dialog role in DOM
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('renders title, description and actions when open', () => {
    render(
      <CancelTrConfirmationDialog
        open
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    // Title and confirm button share the same text 'cancel-tr'
    const cancelTexts = screen.getAllByText('cancel-tr');
    expect(cancelTexts.length).toBeGreaterThan(1);
    expect(
      screen.getByText('cancel-tr-dialog-description'),
    ).toBeInTheDocument();
    expect(screen.getByText('keep-recommendation')).toBeInTheDocument();
    // Confirm button uses same label as title per component
    expect(screen.getAllByText('cancel-tr').length).toBeGreaterThan(1);
  });

  it('calls onCancel when clicking keep button', () => {
    const onCancel = jest.fn();
    render(
      <CancelTrConfirmationDialog
        open
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('keep-recommendation'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when clicking cancel button', () => {
    const onConfirm = jest.fn();
    render(
      <CancelTrConfirmationDialog
        open
        onCancel={() => {}}
        onConfirm={onConfirm}
      />,
    );

    // The confirm button text is also 'cancel-tr'
    const confirmButtons = screen.getAllByText('cancel-tr');
    // The first occurrence can be the title; pick a button element
    const confirmButton =
      confirmButtons.find((el) => el.tagName === 'BUTTON') || confirmButtons[1];
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });
});
