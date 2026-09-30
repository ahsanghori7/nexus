import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnquiryCard from './EnquiryCard';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/helpers/status/enquiries', () => ({
  getStatus: jest.fn(() => ({ label: 'status-active' })),
}));

jest.mock('v2/helpers/enquiryStatusColors', () => jest.fn(() => '#00ff00'));

jest.mock('clink-components', () => ({
  Badge: ({ text, color }) => <span data-testid="badge" style={{ color }}>{text}</span>,
  Card: ({ children, theme }) => <div data-testid="card" data-theme={theme}>{children}</div>,
  CardBody: ({ children, theme }) => <div data-testid="card-body" data-theme={theme}>{children}</div>,
  CardInfoLine: ({ children, theme }) => <div data-testid="card-info-line" data-theme={theme}>{children}</div>,
  CardLink: ({ children, theme, href, disabled }) => (
    <a data-testid="card-link" data-theme={theme} href={href} data-disabled={disabled}>{children}</a>
  ),
  CardTitle: ({ children, theme }) => <div data-testid="card-title" data-theme={theme}>{children}</div>,
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxRed: '#ff0000',
      },
    },
  },
}));

describe('EnquiryCard', () => {
  const mockItem = {
    id: 1,
    contractor: 'Test Contractor',
    status_id: 1,
    project: 'Test Project',
    package: 'Test Package',
    document: {
      enquiry: {
        id: 123,
      },
    },
  };

  it('renders without crashing', () => {
    render(<EnquiryCard item={mockItem} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('displays contractor name', () => {
    render(<EnquiryCard item={mockItem} />);
    expect(screen.getByText('Test Contractor')).toBeInTheDocument();
  });

  it('displays project information', () => {
    render(<EnquiryCard item={mockItem} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('displays package information', () => {
    render(<EnquiryCard item={mockItem} />);
    expect(screen.getByText('Test Package')).toBeInTheDocument();
  });

  it('displays status badge when status_id is present', () => {
    render(<EnquiryCard item={mockItem} />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByText('Status-active')).toBeInTheDocument();
  });

  it('does not display status badge when status_id is not present', () => {
    const itemWithoutStatus = { ...mockItem, status_id: null };
    render(<EnquiryCard item={itemWithoutStatus} />);
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('renders with custom theme', () => {
    const customTheme = 'custom-theme';
    render(<EnquiryCard item={mockItem} theme={customTheme} />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', customTheme);
  });

  it('renders with default theme when no theme provided', () => {
    render(<EnquiryCard item={mockItem} />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-enquiries-small');
  });

  it('renders download link when document has id', () => {
    render(<EnquiryCard item={mockItem} />);
    const cardLink = screen.getByTestId('card-link');
    expect(cardLink).toHaveAttribute('href', 'relay/v1/document/123/download');
    expect(cardLink).toHaveAttribute('data-disabled', 'false');
  });

  it('disables download link when document has no id', () => {
    const itemWithoutDocId = {
      ...mockItem,
      document: {},
    };
    render(<EnquiryCard item={itemWithoutDocId} />);
    const cardLink = screen.getByTestId('card-link');
    expect(cardLink).toHaveAttribute('data-disabled', 'true');
  });

  it('handles document as array', () => {
    const itemWithArrayDoc = {
      ...mockItem,
      document: {
        enquiry: [{ id: 456 }, { id: 789 }],
      },
    };
    render(<EnquiryCard item={itemWithArrayDoc} />);
    const cardLink = screen.getByTestId('card-link');
    expect(cardLink).toHaveAttribute('href', 'relay/v1/document/789/download');
  });

  it('renders package as link when link prop is provided', () => {
    const testLink = 'https://example.com';
    render(<EnquiryCard item={mockItem} link={testLink} />);
    const packageLink = screen.getByRole('link', { name: 'Test Package' });
    expect(packageLink).toHaveAttribute('href', testLink);
  });

  it('renders package as span when no link prop provided', () => {
    render(<EnquiryCard item={mockItem} />);
    const packageSpan = screen.getByText('Test Package');
    expect(packageSpan.tagName).toBe('SPAN');
  });

  it('returns null when item is null', () => {
    const { container } = render(<EnquiryCard item={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles different document types (order)', () => {
    const itemWithOrder = {
      ...mockItem,
      document: {
        order: { id: 999 },
      },
    };
    render(<EnquiryCard item={itemWithOrder} />);
    const cardLink = screen.getByTestId('card-link');
    expect(cardLink).toHaveAttribute('href', 'relay/v1/document/999/download');
  });

  it('handles different document types (tender_addendum)', () => {
    const itemWithTenderAddendum = {
      ...mockItem,
      document: {
        tender_addendum: { id: 888 },
      },
    };
    render(<EnquiryCard item={itemWithTenderAddendum} />);
    const cardLink = screen.getByTestId('card-link');
    expect(cardLink).toHaveAttribute('href', 'relay/v1/document/888/download');
  });
});