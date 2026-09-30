import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddendumDocumentsListing from './AddendumDocumentsListing';

jest.mock('i18next', () => ({
  t: (key) => {
    const translations = {
      'file-name': 'File Name',
      actions: 'Actions',
      file: 'File',
      files: 'Files',
      download: 'Download',
      'unable-to-download': 'Unable to download',
    };
    return translations[key] || key;
  },
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#E5E5F7',
        white: '#FFFFFF',
      },
    },
  },
}));

jest.mock('@mui/material/Accordion', () => ({ children, expanded, onChange }) => (
  <div data-testid="accordion" data-expanded={expanded} onClick={onChange}>
    {children}
  </div>
));

jest.mock('@mui/material/AccordionSummary', () => ({ children, expandIcon }) => (
  <div data-testid="accordion-summary">
    {children}
    {expandIcon}
  </div>
));

jest.mock('@mui/material/AccordionDetails', () => ({ children }) => (
  <div data-testid="accordion-details">{children}</div>
));

jest.mock('@mui/material/Box', () => ({ children, ...props }) => (
  <div data-testid="mui-box" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Typography', () => ({ children, sx, ...props }) => (
  <div data-testid="typography" data-sx={JSON.stringify(sx || {})} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Table', () => ({ children }) => <table data-testid="table">{children}</table>);
jest.mock('@mui/material/TableBody', () => ({ children }) => <tbody>{children}</tbody>);
jest.mock('@mui/material/TableCell', () => ({ children, align }) => (
  <td data-align={align}>{children}</td>
));
jest.mock('@mui/material/TableContainer', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/material/TableHead', () => ({ children }) => <thead>{children}</thead>);
jest.mock('@mui/material/TableRow', () => ({ children }) => <tr>{children}</tr>);
jest.mock('@mui/material/IconButton', () => ({ children, onClick, disabled }) => (
  <button type="button" data-testid="icon-button" disabled={disabled} onClick={onClick}>
    {children}
  </button>
));
jest.mock('@mui/material/Tooltip', () => ({ children, title }) => (
  <div data-testid="tooltip" title={title}>
    {children}
  </div>
));
jest.mock('@mui/material', () => ({
  CircularProgress: () => <span data-testid="circular-progress" />,
}));
jest.mock('@mui/icons-material/ChevronRight', () => () => <span />);
jest.mock('@mui/icons-material/InsertDriveFileOutlined', () => () => (
  <span data-testid="insert-drive-file-outlined-icon" />
));
jest.mock('@mui/icons-material/FileDownloadOutlined', () => () => (
  <span data-testid="file-download-outlined-icon" />
));
jest.mock('@mui/icons-material/Warning', () => () => <span data-testid="warning-icon" />);

describe('AddendumDocumentsListing', () => {
  const mockOnDownload = jest.fn();

  const mockProjects = [
    {
      name: 'UPDATED DOCUMENTS',
      sectionType: 'updated',
      folders: [
        {
          name: 'ND02',
          files: [
            { id: 1001, download_id: null, name: 'updated.pdf', downloadable: true },
            { id: 1002, download_id: null, name: 'failed.pdf', downloadable: false },
          ],
        },
      ],
    },
    {
      name: 'NEW DOCUMENTS',
      sectionType: 'new',
      folders: [
        {
          name: 'ND03',
          files: [{ id: 2001, download_id: null, name: 'new.pdf', downloadable: true }],
        },
      ],
    },
    {
      name: 'WITHDRAWN DOCUMENTS',
      sectionType: 'withdrawn',
      folders: [
        {
          name: 'ND02',
          files: [{ id: null, download_id: null, name: 'withdrawn.pdf', downloadable: false }],
        },
      ],
    },
    {
      name: 'ADDITIONAL DOCUMENTS',
      sectionType: 'additional',
      folders: [
        {
          name: 'Tender Addendum 18/08/26',
          files: [{ id: 75348, download_id: null, name: 'Tender Addendum', downloadable: true }],
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all addendum sections in order', () => {
    render(
      <AddendumDocumentsListing
        projects={mockProjects}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    expect(screen.getByTestId('addendum-documents-listing')).toBeInTheDocument();
    expect(screen.getByTestId('addendum-section-updated')).toBeInTheDocument();
    expect(screen.getByTestId('addendum-section-new')).toBeInTheDocument();
    expect(screen.getByTestId('addendum-section-withdrawn')).toBeInTheDocument();
    expect(screen.getByTestId('addendum-section-additional')).toBeInTheDocument();
  });

  it('renders file names for each section', () => {
    render(
      <AddendumDocumentsListing
        projects={mockProjects}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    expect(screen.getByText('updated.pdf')).toBeInTheDocument();
    expect(screen.getByText('new.pdf')).toBeInTheDocument();
    expect(screen.getByText('withdrawn.pdf')).toBeInTheDocument();
    expect(screen.getByText('Tender Addendum')).toBeInTheDocument();
  });

  it('does not render download button for withdrawn documents', () => {
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[2]]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    expect(screen.queryByTestId('icon-button')).not.toBeInTheDocument();
  });

  it('does not render download button when downloadable is false', () => {
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[0]]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    const downloadButtons = screen.getAllByTestId('icon-button');
    expect(downloadButtons).toHaveLength(1);
    expect(screen.getByText('failed.pdf')).toBeInTheDocument();
  });

  it('calls onDownload when a downloadable file is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[0]]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    await user.click(screen.getByTestId('icon-button'));

    expect(mockOnDownload).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1001, name: 'updated.pdf' }),
      'ND02',
      'UPDATED DOCUMENTS',
      'ready_partial'
    );
  });

  it('does not show spinner when downloadingFileId is null and download_id is null', () => {
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[0]]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument();
    expect(screen.getByTestId('file-download-outlined-icon')).toBeInTheDocument();
  });

  it('shows spinner only for the file being downloaded', () => {
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[0]]}
        onDownload={mockOnDownload}
        downloadingFileId={1001}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  it('shows download error message for failed files', () => {
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[0]]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{ 1001: true }}
        state="ready_partial"
      />
    );

    expect(screen.getByText('Unable to download')).toBeInTheDocument();
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });

  it('applies strikethrough styling to withdrawn file names', () => {
    render(
      <AddendumDocumentsListing
        projects={[mockProjects[2]]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    const withdrawnLabel = screen.getByText('withdrawn.pdf');
    expect(withdrawnLabel).toHaveAttribute('data-sx', JSON.stringify({
      textDecoration: 'line-through',
      color: 'text.disabled',
    }));
  });

  it('handles empty projects array', () => {
    render(
      <AddendumDocumentsListing
        projects={[]}
        onDownload={mockOnDownload}
        downloadingFileId={null}
        downloadErrors={{}}
        state="ready_partial"
      />
    );

    expect(screen.getByTestId('addendum-documents-listing')).toBeInTheDocument();
    expect(screen.queryByTestId('addendum-section-updated')).not.toBeInTheDocument();
  });
});
