import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnquiryCardV2 from './EnquiryCardV2';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/helpers/status/enquiries', () => ({
  getStatus: jest.fn(() => ({ label: 'status-active' })),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxRed: '#ff0000',
      },
    },
  },
}));

describe('EnquiryCardV2', () => {
  const mockItem = {
    id: 1,
    contractor: 'Test Contractor V2',
    status_id: 1,
    project: 'Test Project V2',
    package: 'Test Package V2',
    document: {
      enquiry: {
        id: 123,
      },
    },
  };

  it('renders without crashing', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    expect(screen.getByTestId('mui-card')).toBeInTheDocument();
  });

  it('displays contractor name', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    expect(screen.getByText('Test Contractor V2')).toBeInTheDocument();
  });

  it('displays project information', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    expect(screen.getByText('Test Project V2')).toBeInTheDocument();
  });

  it('displays package information', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    expect(screen.getByText('Test Package V2')).toBeInTheDocument();
  });

  it('displays status chip when status_id is present', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    const chipElement = screen.getByTestId('chip');
    expect(chipElement).toHaveAttribute('color', 'error');
    expect(chipElement).toHaveTextContent('Status-active');
  });

  it('does not display status chip when status_id is not present', () => {
    const itemWithoutStatus = { ...mockItem, status_id: null };
    render(<EnquiryCardV2 item={itemWithoutStatus} />);
    expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
  });

  it('renders download link when document has id', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    const downloadLink = screen.getByRole('link', { name: /text-download-documents/i });
    expect(downloadLink).toHaveAttribute('href', 'relay/v1/document/123/download');
  });

  it('does not render download section when document has no id', () => {
    const itemWithoutDocId = {
      ...mockItem,
      document: {},
    };
    render(<EnquiryCardV2 item={itemWithoutDocId} />);
    expect(screen.queryByRole('link', { name: /text-download-documents/i })).not.toBeInTheDocument();
  });

  it('handles document as array', () => {
    const itemWithArrayDoc = {
      ...mockItem,
      document: {
        enquiry: [{ id: 456 }, { id: 789 }],
      },
    };
    render(<EnquiryCardV2 item={itemWithArrayDoc} />);
    const downloadLink = screen.getByRole('link', { name: /text-download-documents/i });
    expect(downloadLink).toHaveAttribute('href', 'relay/v1/document/789/download');
  });

  it('renders package as link when link prop is provided', () => {
    const testLink = 'https://example.com';
    render(<EnquiryCardV2 item={mockItem} link={testLink} />);
    const packageLink = screen.getByRole('link', { name: 'Test Package V2' });
    expect(packageLink).toHaveAttribute('href', testLink);
  });

  it('renders package as span when no link prop provided', () => {
    render(<EnquiryCardV2 item={mockItem} />);
    const packageSpan = screen.getByText('Test Package V2');
    expect(packageSpan.tagName).toBe('SPAN');
  });

  it('handles different document types (order)', () => {
    const itemWithOrder = {
      ...mockItem,
      document: {
        order: { id: 999 },
      },
    };
    render(<EnquiryCardV2 item={itemWithOrder} />);
    const downloadLink = screen.getByRole('link', { name: /text-download-documents/i });
    expect(downloadLink).toHaveAttribute('href', 'relay/v1/document/999/download');
  });

  it('handles different document types (tender_addendum)', () => {
    const itemWithTenderAddendum = {
      ...mockItem,
      document: {
        tender_addendum: { id: 888 },
      },
    };
    render(<EnquiryCardV2 item={itemWithTenderAddendum} />);
    const downloadLink = screen.getByRole('link', { name: /text-download-documents/i });
    expect(downloadLink).toHaveAttribute('href', 'relay/v1/document/888/download');
  });

  describe('getStatusColor function', () => {
    it('returns correct color for status id 1', () => {
      const itemWithStatus1 = { ...mockItem, status_id: 1 };
      render(<EnquiryCardV2 item={itemWithStatus1} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'error');
    });

    it('returns correct color for status id 4', () => {
      const itemWithStatus4 = { ...mockItem, status_id: 4 };
      render(<EnquiryCardV2 item={itemWithStatus4} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'secondary');
    });

    it('returns correct color for status id 2', () => {
      const itemWithStatus2 = { ...mockItem, status_id: 2 };
      render(<EnquiryCardV2 item={itemWithStatus2} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'primary');
    });

    it('returns correct color for status id 3', () => {
      const itemWithStatus3 = { ...mockItem, status_id: 3 };
      render(<EnquiryCardV2 item={itemWithStatus3} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'primary');
    });

    it('returns correct color for status id 5', () => {
      const itemWithStatus5 = { ...mockItem, status_id: 5 };
      render(<EnquiryCardV2 item={itemWithStatus5} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'error');
    });

    it('returns correct color for status id 6', () => {
      const itemWithStatus6 = { ...mockItem, status_id: 6 };
      render(<EnquiryCardV2 item={itemWithStatus6} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'error');
    });

    it('returns correct color for status id 7', () => {
      const itemWithStatus7 = { ...mockItem, status_id: 7 };
      render(<EnquiryCardV2 item={itemWithStatus7} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'success');
    });

    it('returns correct color for status id 9', () => {
      const itemWithStatus9 = { ...mockItem, status_id: 9 };
      render(<EnquiryCardV2 item={itemWithStatus9} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', 'purple');
    });

    it('returns empty string for unknown status id', () => {
      const itemWithUnknownStatus = { ...mockItem, status_id: 999 };
      render(<EnquiryCardV2 item={itemWithUnknownStatus} />);
      const chipElement = screen.getByTestId('chip');
      expect(chipElement).toHaveAttribute('color', '');
    });
  });
});
