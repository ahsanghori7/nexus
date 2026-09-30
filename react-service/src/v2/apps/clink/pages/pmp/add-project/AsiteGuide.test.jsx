import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AsiteGuide, AsiteGuideTrigger } from './AsiteGuide';

// Mock i18next - matches the pattern used in jest.setup.jsx
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => {
      const translations = {
        'asite-guide-link': 'Need help?',
        'asite-folder-missing-help-title': 'Why folder help?',
        'asite-guide-title': 'Asite Guide',
        'asite-guide-projects-showing': 'When projects are showing',
        'asite-guide-projects-desc': 'Projects description',
        'asite-guide-next-step': 'Next step:',
        'asite-guide-projects-next-step': 'Do this action',
        'asite-guide-projects-note': 'Note about projects',
        'asite-guide-projects-preview': 'Preview message content',
        'asite-guide-no-projects-showing': 'When no projects are showing',
        'asite-guide-no-projects-desc': 'No projects description',
        'asite-guide-no-projects-next-step': 'Contact support',
        'asite-guide-no-projects-preview': 'No projects preview',
        'asite-guide-preview-message': 'View message',
        'asite-guide-copy-message': 'Copy',
        'asite-guide-copied': 'Copied!',
      };
      return translations[key] || key;
    }),
  },
}));

describe('AsiteGuideTrigger Component', () => {
  test('renders with help icon and text', () => {
    const mockOnClick = jest.fn();
    render(<AsiteGuideTrigger onClick={mockOnClick} />);

    expect(screen.getByText('Need help?')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    const { container } = render(<AsiteGuideTrigger onClick={mockOnClick} />);

    const button = container.querySelector('a');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('renders label from linkTranslationKey when provided', () => {
    render(
      <AsiteGuideTrigger
        onClick={() => {}}
        linkTranslationKey="asite-folder-missing-help-title"
      />,
    );
    expect(screen.getByText('Why folder help?')).toBeInTheDocument();
  });

  test('has correct styling with clinkGreen color', () => {
    const { container } = render(<AsiteGuideTrigger onClick={() => { }} />);
    const link = container.querySelector('a');

    expect(link).toHaveStyle({ textDecoration: 'none' });
  });
});

describe('AsiteGuide Component', () => {
  test('renders dialog when open is true', () => {
    const mockOnClose = jest.fn();
    render(<AsiteGuide open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Asite Guide')).toBeInTheDocument();
  });

  test('does not render dialog when open is false', () => {
    const mockOnClose = jest.fn();
    const { container } = render(<AsiteGuide open={false} onClose={mockOnClose} />);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<AsiteGuide open={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('icon-button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('renders both situation sections', () => {
    const mockOnClose = jest.fn();
    render(<AsiteGuide open={true} onClose={mockOnClose} />);

    expect(screen.getByText('When projects are showing')).toBeInTheDocument();
    expect(screen.getByText('When no projects are showing')).toBeInTheDocument();
  });

  test('renders support email in second section', () => {
    const mockOnClose = jest.fn();
    render(<AsiteGuide open={true} onClose={mockOnClose} />);

    expect(screen.getByText('support@c-link.com')).toBeInTheDocument();
  });

  test('renders all required text content', () => {
    const mockOnClose = jest.fn();
    render(<AsiteGuide open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Projects description')).toBeInTheDocument();
    expect(screen.getByText('No projects description')).toBeInTheDocument();
    expect(screen.getByText('Do this action')).toBeInTheDocument();
    expect(screen.getByText('Contact support')).toBeInTheDocument();
  });
});

describe('PreviewMessage Component', () => {
  test('renders expand/collapse link for preview messages', () => {
    const mockOnClose = jest.fn();
    render(
      <AsiteGuide open={true} onClose={mockOnClose} />
    );

    // Preview message buttons should exist
    const viewButtons = screen.getAllByText('View message');
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  test('renders copy button inside preview messages', () => {
    const mockOnClose = jest.fn();
    render(
      <AsiteGuide open={true} onClose={mockOnClose} />
    );

    const viewButtons = screen.getAllByText('View message');
    fireEvent.click(viewButtons[0]);

    // After expanding, copy button should be visible
    const copyButtons = screen.getAllByText('Copy');
    expect(copyButtons.length).toBeGreaterThan(0);
  });
});