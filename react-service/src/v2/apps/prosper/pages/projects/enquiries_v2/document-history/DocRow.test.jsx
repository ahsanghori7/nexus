import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import moment from 'moment';
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

import DocRow from 'v2/apps/prosper/pages/projects/enquiries_v2/document-history/DocRow';

const defaultRow = {
  id: '123',
  date: '2024-01-15T10:30:45',
};

const defaultProps = {
  row: defaultRow,
  documentName: 'Prosper Document',
  index: 1,
  applyBorder: '1px solid rgb(0, 0, 0)',
};

const renderDocRow = (overrideProps = {}) =>
  render(
    <table>
      <tbody>
        <DocRow {...defaultProps} {...overrideProps} />
      </tbody>
    </table>,
  );

describe('DocRow', () => {
  beforeEach(() => {
    goToNewTab.mockClear();
  });

  it('renders row data with formatted date and document labels', () => {
    renderDocRow();

    const cells = screen.getAllByTestId('mui-tablecell');
    expect(cells).toHaveLength(4);

    const expectedDate = moment(defaultRow.date).format('DD/MM/YYYY - HH:mm:ss');
    expect(cells[0]).toHaveTextContent(expectedDate);
    expect(cells[1]).toHaveTextContent('Prosper Document');
    expect(cells[2]).toHaveTextContent('Prosper Document 1');
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
  });

  it('opens a new tab with download link when icon button is clicked', () => {
    renderDocRow();

    const downloadButton = screen.getByTestId('doc-row-download-123');
    fireEvent.click(downloadButton);

    expect(goToNewTab).toHaveBeenCalledWith('/relay/v1/document/123/download');
  });

  it('keeps the button enabled even when document id is missing', () => {
    renderDocRow({ row: { ...defaultRow, id: null } });

    fireEvent.click(screen.getByTestId('doc-row-download-null'));

    expect(goToNewTab).toHaveBeenCalledWith('');
  });
});
