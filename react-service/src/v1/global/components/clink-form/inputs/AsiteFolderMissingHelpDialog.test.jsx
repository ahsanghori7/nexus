import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AsiteFolderMissingHelpDialog from './AsiteFolderMissingHelpDialog';

const COPY_MESSAGE = 'Copy message preview text';

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => {
      const translations = {
        'asite-folder-missing-help-title': 'Why folder help?',
        'asite-folder-missing-help-close-aria': 'Close',
        'asite-folder-missing-help-common-reasons-heading': 'Common reasons',
        'asite-folder-missing-help-reason-1': 'Reason one',
        'asite-folder-missing-help-reason-2': 'Reason two',
        'asite-folder-missing-help-reason-3': 'Reason three',
        'asite-folder-missing-help-reason-4': 'Reason four',
        'asite-folder-missing-help-expected-path-label': 'Expected path:',
        'asite-folder-missing-help-expected-path-value': '03 Commercial > Trade Packages',
        'asite-folder-missing-help-next-step-heading': 'Next step',
        'asite-folder-missing-help-next-step-body': 'Contact representative',
        'asite-folder-missing-help-copy-intro': 'Copy intro',
        'asite-folder-missing-help-copy-message': COPY_MESSAGE,
        'asite-folder-missing-help-copied': 'Copied to clipboard!',
        'asite-folder-missing-help-go-back': 'Go Back',
        'asite-guide-copy-message': 'Copy message',
      };
      return translations[key] || key;
    }),
  },
}));

describe('AsiteFolderMissingHelpDialog', () => {
  const mockOnClose = jest.fn();
  let writeTextMock;

  beforeEach(() => {
    jest.clearAllMocks();
    writeTextMock = jest.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'isSecureContext', {
      configurable: true,
      value: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });
  });

  test('renders dialog content when open', () => {
    render(<AsiteFolderMissingHelpDialog open onClose={mockOnClose} />);

    expect(screen.getByText('Why folder help?')).toBeInTheDocument();
    expect(screen.getByText(COPY_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText('Copy message')).toBeInTheDocument();
  });

  test('does not render dialog when closed', () => {
    render(<AsiteFolderMissingHelpDialog open={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Why folder help?')).not.toBeInTheDocument();
  });

  test('calls onClose from close control and Go Back button', () => {
    render(<AsiteFolderMissingHelpDialog open onClose={mockOnClose} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Go Back'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  test('copies message to clipboard on success', async () => {
    render(<AsiteFolderMissingHelpDialog open onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Copy message'));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(COPY_MESSAGE);
    });
    expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
  });

  test('does not show copied state when clipboard copy fails', async () => {
    writeTextMock.mockRejectedValue(new Error('Clipboard denied'));

    render(<AsiteFolderMissingHelpDialog open onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Copy message'));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
    expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument();
    expect(screen.getByText('Copy message')).toBeInTheDocument();
  });

  test('resets copied state when dialog closes', async () => {
    const { rerender } = render(
      <AsiteFolderMissingHelpDialog open onClose={mockOnClose} />,
    );

    fireEvent.click(screen.getByText('Copy message'));
    await waitFor(() =>
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument(),
    );

    rerender(<AsiteFolderMissingHelpDialog open={false} onClose={mockOnClose} />);
    rerender(<AsiteFolderMissingHelpDialog open onClose={mockOnClose} />);

    expect(screen.getByText('Copy message')).toBeInTheDocument();
  });
});
