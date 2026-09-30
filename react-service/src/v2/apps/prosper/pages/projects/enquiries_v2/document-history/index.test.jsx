import React from 'react';
import { render, screen } from '@testing-library/react';
import DocumentHistory from 'v2/apps/prosper/pages/projects/enquiries_v2/document-history';
import { goToNewTab } from 'v2/helpers/url';

jest.mock('@mui/icons-material', () => {
  const React = require('react');
  const Download = React.forwardRef((props, ref) =>
    React.createElement('span', { 'data-testid': 'download-icon', ...props, ref }),
  );
  Download.displayName = 'DownloadIcon';
  return {
    __esModule: true,
    Download,
  };
});

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('lodash/capitalize', () => jest.fn((value) => (value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '')));
jest.mock('lodash/isArray', () => jest.fn((value) => Array.isArray(value)));

const renderHistory = (selected) =>
  render(<DocumentHistory selected={selected} />);

describe('DocumentHistory', () => {
  beforeEach(() => {
    goToNewTab.mockClear();
  });

  it('renders the enquiry history heading when no selection is provided', () => {
    renderHistory(undefined);

    expect(screen.getByText('enquiry-history')).toBeInTheDocument();
    expect(screen.getAllByTestId('mui-tablecell')).toHaveLength(4);
  });

  it('renders a single enquiry row from object data', () => {
    const selected = {
      document: {
        enquiry: {
          id: 'enq-1',
          date: '2023-10-15T10:30:00Z',
        },
      },
    };

    renderHistory(selected);

    expect(screen.getByText('Tender document 1')).toBeInTheDocument();
    expect(screen.getByTestId('doc-row-download-enq-1')).toBeInTheDocument();
  });

  it('renders multiple enquiry rows when provided as an array', () => {
    const selected = {
      document: {
        enquiry: [
          { id: 'enq-1', date: '2023-10-15T10:30:00Z' },
          { id: 'enq-2', date: '2023-10-16T08:00:00Z' },
        ],
      },
    };

    renderHistory(selected);

    expect(screen.getByTestId('doc-row-download-enq-1')).toBeInTheDocument();
    expect(screen.getByTestId('doc-row-download-enq-2')).toBeInTheDocument();
    expect(screen.getByText('Tender document 1')).toBeInTheDocument();
    expect(screen.getByText('Tender document 2')).toBeInTheDocument();
  });

  it('renders order and tender addendum rows independently', () => {
    const selected = {
      document: {
        order: {
          id: 'order-15',
          date: '2023-11-01T09:15:00Z',
        },
        tender_addendum: [
          { id: 'ta-1', date: '2023-12-05T12:00:00Z' },
          { id: 'ta-2', date: '2024-01-02T15:45:00Z' },
        ],
      },
    };

    renderHistory(selected);

    expect(screen.getByText('Order 1')).toBeInTheDocument();
    expect(screen.getByText('Tender addendum 1')).toBeInTheDocument();
    expect(screen.getByText('Tender addendum 2')).toBeInTheDocument();
  });

  it('renders table headers using translated titles', () => {
    renderHistory({
      document: {
        enquiry: { id: 'enq-unique', date: '2024-02-01T10:00:00Z' },
      },
    });

    expect(screen.getByText('Received-date')).toBeInTheDocument();
    expect(screen.getByText('Profile-description')).toBeInTheDocument();
    expect(screen.getByText('Version-number')).toBeInTheDocument();
  });
});
