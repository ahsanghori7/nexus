import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DocumentsListingPreview from './DocumentsListingPreview';

// Mock i18next
jest.mock('i18next', () => ({
  t: (key) => {
    const translations = {
      'file-name': 'File Name',
      'actions': 'Actions',
      'file': 'File',
      'files': 'Files',
      'download': 'Download',
      'unable-to-download': 'Unable to download',
    };
    return translations[key] || key;
  },
}));

// Mock clink-components
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

// Mock MUI components
jest.mock('@mui/material/Accordion', () => ({ children, expanded, onChange, sx, ...props }) => (
  <div data-testid="accordion" data-expanded={expanded} onClick={onChange} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/AccordionSummary', () => ({ children, expandIcon, sx }) => (
  <div data-testid="accordion-summary">
    {children}
    {expandIcon}
  </div>
));

jest.mock('@mui/material/AccordionDetails', () => ({ children, sx }) => (
  <div data-testid="accordion-details">{children}</div>
));

jest.mock('@mui/material/Box', () => ({ children, sx, ...props }) => (
  <div data-testid="mui-box" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Typography', () => ({ children, variant, ...props }) => (
  <div data-testid={`typography-${variant}`} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Table', () => ({ children, size }) => (
  <table data-testid="table" data-size={size}>
    {children}
  </table>
));

jest.mock('@mui/material/TableBody', () => ({ children, sx }) => (
  <tbody data-testid="table-body">{children}</tbody>
));

jest.mock('@mui/material/TableCell', () => ({ children, align, width, ...props }) => (
  <td data-testid="table-cell" data-align={align} data-width={width} {...props}>
    {children}
  </td>
));

jest.mock('@mui/material/TableContainer', () => ({ children }) => (
  <div data-testid="table-container">{children}</div>
));

jest.mock('@mui/material/TableHead', () => ({ children }) => (
  <thead data-testid="table-head">{children}</thead>
));

jest.mock('@mui/material/TableRow', () => ({ children, sx, ...props }) => (
  <tr data-testid="table-row" {...props}>{children}</tr>
));

jest.mock('@mui/material/IconButton', () => {
  return function IconButton({ children, onClick, size, disabled, ...props }) {
    return (
      <button 
        data-testid="icon-button" 
        data-size={size} 
        onClick={onClick} 
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Tooltip', () => ({ children, title }) => (
  <div data-testid="tooltip" title={title}>
    {typeof children === 'function' ? children({}) : children}
  </div>
));

// Mock CircularProgress separately to handle named import
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    CircularProgress: ({ size, color }) => (
      <div data-testid="circular-progress" data-size={size} data-color={color}>
        Loading...
      </div>
    ),
  };
});

// Mock Material UI Icons
jest.mock('@mui/icons-material/ChevronRight', () => () => <span>ChevronRight</span>);
jest.mock('@mui/icons-material/InsertDriveFileOutlined', () => () => <span>FileIcon</span>);
jest.mock('@mui/icons-material/FileDownloadOutlined', () => () => <span>DownloadIcon</span>);
jest.mock('@mui/icons-material/Warning', () => () => <span>WarningIcon</span>);

describe('DocumentsListingPreview', () => {
  const mockProjects = [
    {
      id: 1,
      name: 'PROJECT SPECIFIC DOCUMENTS',
      folders: [
        {
          id: 101,
          name: 'ND01',
          files: [
            { id: 1001, name: 'document1.pdf', download_uri: 'https://example.com/doc1.pdf' },
            { id: 1002, name: 'document2.pdf', download_uri: 'https://example.com/doc2.pdf' },
          ],
        },
        {
          id: 102,
          name: 'ND02',
          files: [
            { id: 1003, name: 'document3.pdf', download_uri: 'https://example.com/doc3.pdf' },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'ADDITIONAL DOCUMENTS',
      folders: [
        {
          id: 201,
          name: 'Architectural',
          files: [
            { id: 2001, name: 'arch-doc.pdf', download_uri: 'https://example.com/arch.pdf' },
          ],
        },
      ],
    },
  ];

  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.open = jest.fn();
  });

  afterEach(() => {
    delete global.open;
  });

  describe('DocumentsListingPreview Component', () => {
    it('renders without crashing', () => {
      render(<DocumentsListingPreview projects={[]} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByTestId('download-manager-documents-listing-preview')).toBeInTheDocument();
    });

    it('renders all projects', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText('PROJECT SPECIFIC DOCUMENTS')).toBeInTheDocument();
      expect(screen.getByText('ADDITIONAL DOCUMENTS')).toBeInTheDocument();
    });

    it('renders all folders within projects', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText('ND01')).toBeInTheDocument();
      expect(screen.getByText('ND02')).toBeInTheDocument();
      expect(screen.getByText('Architectural')).toBeInTheDocument();
    });

    it('renders correct file count for each folder', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText((content, element) => {
        return element.textContent === '2 Files';
      })).toBeInTheDocument();
      const singleFileTexts = screen.getAllByText((content, element) => {
        return element.textContent === '1 File';
      });
      expect(singleFileTexts.length).toBeGreaterThan(0);
    });

    it('handles empty projects array', () => {
      render(<DocumentsListingPreview projects={[]} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();
    });

    it('handles projects with no folders', () => {
      const projectsWithNoFolders = [
        { id: 1, name: 'Empty Project', folders: [] },
      ];
      render(<DocumentsListingPreview projects={projectsWithNoFolders} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText('Empty Project')).toBeInTheDocument();
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();
    });
  });

  describe('FolderAccordion Component', () => {
    it('renders folder name and file count', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      const folder = mockProjects[0].folders[0];
      expect(screen.getByText(folder.name)).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element.textContent === '2 Files';
      })).toBeInTheDocument();
    });

    it('displays singular "file" for single file', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      const singleFileTexts = screen.getAllByText((content, element) => {
        return element.textContent === '1 File';
      });
      expect(singleFileTexts.length).toBeGreaterThan(0);
    });

    it('expands first folder by default', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      const accordions = screen.getAllByTestId(/^download-manager-folder-/);
      expect(accordions[0]).toHaveAttribute('data-expanded', 'true');
    });

    it('does not expand subsequent folders by default', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      const accordions = screen.getAllByTestId(/^download-manager-folder-/);
      expect(accordions[1]).toHaveAttribute('data-expanded', 'false');
    });

    it('toggles expansion when clicked', async () => {
      const user = userEvent.setup();
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      
      const accordions = screen.getAllByTestId(/^download-manager-folder-/);
      const secondAccordion = accordions[1];
      
      expect(secondAccordion).toHaveAttribute('data-expanded', 'false');
      
      await user.click(secondAccordion);
      
      expect(secondAccordion).toHaveAttribute('data-expanded', 'true');
    });

    it('handles folders with no files', () => {
      const projectsWithEmptyFolder = [
        {
          id: 1,
          name: 'Test Project',
          folders: [
            { id: 101, name: 'Empty Folder', files: [] },
          ],
        },
      ];
      render(<DocumentsListingPreview projects={projectsWithEmptyFolder} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText((content, element) => {
        return element.textContent === '0 Files';
      })).toBeInTheDocument();
    });
  });

  describe('data-testid attributes', () => {
    it('root box has download-manager-documents-listing-preview testid', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByTestId('download-manager-documents-listing-preview')).toBeInTheDocument();
    });

    it.each([
      ['download-manager-section-1'],
      ['download-manager-section-2'],
      ['download-manager-folder-101'],
      ['download-manager-folder-102'],
      ['download-manager-folder-201'],
      ['download-manager-file-row-1001'],
      ['download-manager-file-row-1002'],
      ['download-manager-file-download-1001'],
      ['download-manager-file-download-1002'],
    ])('renders element with testid %s', (testId) => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  describe('FilesTable Component', () => {
    it('renders table headers', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      const fileNameHeaders = screen.getAllByText('File Name');
      const actionsHeaders = screen.getAllByText('Actions');
      expect(fileNameHeaders.length).toBeGreaterThan(0);
      expect(actionsHeaders.length).toBeGreaterThan(0);
    });

    it('renders all files in expanded folder', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
      expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    });

    it('renders download buttons for each file', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} state="snapshot_preview" />);
      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      expect(iconButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Download Behavior', () => {
    describe('onDownload callback', () => {
      it('calls onDownload with file, folderLabel, projectName, and state parameters', async () => {
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="snapshot_preview"
            downloadingFileId={null}
          />
        );
        
        const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
        const downloadButton = iconButtons[0];
        
        fireEvent.click(downloadButton);
        
        expect(mockOnDownload).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1001,
            name: 'document1.pdf',
            download_uri: 'https://example.com/doc1.pdf',
          }),
          'ND01',
          'PROJECT SPECIFIC DOCUMENTS',
          'snapshot_preview'
        );
      });

      it('calls onDownload for ADDITIONAL DOCUMENTS with correct parameters', async () => {
        const additionalDocsOnly = mockProjects.filter(p => p.name === 'ADDITIONAL DOCUMENTS');
        
        render(
          <DocumentsListingPreview 
            projects={additionalDocsOnly} 
            onDownload={mockOnDownload} 
            state="snapshot_preview"
            downloadingFileId={null}
          />
        );
        
        const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
        const downloadButton = iconButtons[0];
        
        fireEvent.click(downloadButton);
        
        expect(mockOnDownload).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 2001,
            name: 'arch-doc.pdf',
            download_uri: 'https://example.com/arch.pdf',
          }),
          'Architectural',
          'ADDITIONAL DOCUMENTS',
          'snapshot_preview'
        );
      });

      it('calls onDownload when state is not "snapshot_preview"', async () => {
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="ready"
            downloadingFileId={null}
          />
        );
        
        const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
        const downloadButton = iconButtons[0];
        
        fireEvent.click(downloadButton);
        
        expect(mockOnDownload).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1001,
            name: 'document1.pdf',
          }),
          'ND01',
          'PROJECT SPECIFIC DOCUMENTS',
          'ready'
        );
      });
    });

    describe('download button state', () => {
      it('disables download button when file is being downloaded', () => {
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="snapshot_preview"
            downloadingFileId={1001}
          />
        );
        
        const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
        expect(iconButtons[0]).toBeDisabled();
      });

      it('does not disable other buttons when a different file is downloading', () => {
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="snapshot_preview"
            downloadingFileId={1001}
          />
        );
        
        const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
        expect(iconButtons[1]).not.toBeDisabled();
      });

      it('shows circular progress when file is being downloaded', () => {
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="snapshot_preview"
            downloadingFileId={1001}
          />
        );
        
        expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
      });
    });

    describe('download error handling', () => {
      it('displays error message when download fails', () => {
        const downloadErrors = { 1001: true };
        
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="ready"
            downloadErrors={downloadErrors}
          />
        );
        
        expect(screen.getByText('Unable to download')).toBeInTheDocument();
      });

      it('displays error for multiple failed downloads', () => {
        const downloadErrors = { 1001: true, 1002: true };
        
        render(
          <DocumentsListingPreview 
            projects={mockProjects} 
            onDownload={mockOnDownload} 
            state="ready"
            downloadErrors={downloadErrors}
          />
        );
        
        const errorMessages = screen.getAllByText('Unable to download');
        expect(errorMessages).toHaveLength(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onDownload prop', () => {
      render(<DocumentsListingPreview projects={mockProjects} state="snapshot_preview" />);
      expect(screen.getByText('PROJECT SPECIFIC DOCUMENTS')).toBeInTheDocument();
    });

    it('handles files with special characters in names', () => {
      const projectsWithSpecialChars = [
        {
          id: 1,
          name: 'Test Project',
          folders: [
            {
              id: 101,
              name: 'Test Folder',
              files: [
                { id: 1001, name: 'file-with-dashes.pdf', download_uri: 'https://example.com/1.pdf' },
                { id: 1002, name: 'file_with_underscores.pdf', download_uri: 'https://example.com/2.pdf' },
                { id: 1003, name: 'file (with) parens.pdf', download_uri: 'https://example.com/3.pdf' },
              ],
            },
          ],
        },
      ];
      render(<DocumentsListingPreview projects={projectsWithSpecialChars} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(screen.getByText('file-with-dashes.pdf')).toBeInTheDocument();
      expect(screen.getByText('file_with_underscores.pdf')).toBeInTheDocument();
      expect(screen.getByText('file (with) parens.pdf')).toBeInTheDocument();
    });

    it('handles very long file names', () => {
      const projectsWithLongNames = [
        {
          id: 1,
          name: 'Test Project',
          folders: [
            {
              id: 101,
              name: 'Test Folder',
              files: [
                {
                  id: 1001,
                  name: 'this-is-a-very-long-file-name-that-might-cause-layout-issues-in-the-ui.pdf',
                  download_uri: 'https://example.com/long.pdf',
                },
              ],
            },
          ],
        },
      ];
      render(<DocumentsListingPreview projects={projectsWithLongNames} onDownload={mockOnDownload} state="snapshot_preview" />);
      expect(
        screen.getByText('this-is-a-very-long-file-name-that-might-cause-layout-issues-in-the-ui.pdf')
      ).toBeInTheDocument();
    });

    it('handles multiple projects with same folder names', () => {
      const projectsWithDuplicateFolderNames = [
        {
          id: 1,
          name: 'Project 1',
          folders: [{ id: 101, name: 'Documents', files: [] }],
        },
        {
          id: 2,
          name: 'Project 2',
          folders: [{ id: 201, name: 'Documents', files: [] }],
        },
      ];
      render(<DocumentsListingPreview projects={projectsWithDuplicateFolderNames} onDownload={mockOnDownload} state="snapshot_preview" />);
      const documentsFolders = screen.getAllByText('Documents');
      expect(documentsFolders).toHaveLength(2);
    });

    it('handles missing download_uri in files', async () => {
      const projectsWithoutUri = [
        {
          id: 1,
          name: 'PROJECT SPECIFIC DOCUMENTS',
          folders: [
            {
              id: 101,
              name: 'Test Folder',
              files: [
                { id: 1001, name: 'no-uri-file.pdf' },
              ],
            },
          ],
        },
      ];
      
      render(
        <DocumentsListingPreview 
          projects={projectsWithoutUri} 
          onDownload={mockOnDownload} 
          state="snapshot_preview"
          downloadingFileId={null}
        />
      );
      
      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      fireEvent.click(iconButtons[0]);
      
      expect(mockOnDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1001,
          name: 'no-uri-file.pdf',
        }),
        'Test Folder',
        'PROJECT SPECIFIC DOCUMENTS',
        'snapshot_preview'
      );
    });

    it('handles undefined state prop', () => {
      render(<DocumentsListingPreview projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByText('PROJECT SPECIFIC DOCUMENTS')).toBeInTheDocument();
    });

    it('handles empty downloadErrors object', () => {
      render(
        <DocumentsListingPreview 
          projects={mockProjects} 
          onDownload={mockOnDownload} 
          state="ready"
          downloadErrors={{}}
        />
      );
      expect(screen.queryByText('Unable to download')).not.toBeInTheDocument();
    });

    it('handles null downloadErrors prop', () => {
      render(
        <DocumentsListingPreview 
          projects={mockProjects} 
          onDownload={mockOnDownload} 
          state="ready"
          downloadErrors={null}
        />
      );
      expect(screen.queryByText('Unable to download')).not.toBeInTheDocument();
    });
  });

  describe('Project Name Handling', () => {
    it('passes "ADDITIONAL DOCUMENTS" project name to onDownload', async () => {
      const additionalDocsUppercase = [
        {
          id: 1,
          name: 'ADDITIONAL DOCUMENTS',
          folders: [
            {
              id: 101,
              name: 'Test Folder',
              files: [
                { id: 1001, name: 'test.pdf', download_uri: 'https://example.com/test.pdf' },
              ],
            },
          ],
        },
      ];
      
      render(
        <DocumentsListingPreview 
          projects={additionalDocsUppercase} 
          onDownload={mockOnDownload} 
          state="snapshot_preview"
          downloadingFileId={null}
        />
      );
      
      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      fireEvent.click(iconButtons[0]);
      
      expect(mockOnDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1001,
          name: 'test.pdf',
          download_uri: 'https://example.com/test.pdf',
        }),
        'Test Folder',
        'ADDITIONAL DOCUMENTS',
        'snapshot_preview'
      );
    });

    it('passes lowercase project name to onDownload', async () => {
      const additionalDocsLowercase = [
        {
          id: 1,
          name: 'additional documents',
          folders: [
            {
              id: 101,
              name: 'Test Folder',
              files: [
                { id: 1001, name: 'test.pdf', download_uri: 'https://example.com/test.pdf' },
              ],
            },
          ],
        },
      ];
      
      render(
        <DocumentsListingPreview 
          projects={additionalDocsLowercase} 
          onDownload={mockOnDownload} 
          state="snapshot_preview"
          downloadingFileId={null}
        />
      );
      
      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      fireEvent.click(iconButtons[0]);
      
      expect(mockOnDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1001,
          name: 'test.pdf',
          download_uri: 'https://example.com/test.pdf',
        }),
        'Test Folder',
        'additional documents',
        'snapshot_preview'
      );
    });
  });

  describe('Download ID Fallback Behavior', () => {
    const projectsWithDownloadIdOnly = [
      {
        id: 1,
        name: 'PROJECT SPECIFIC DOCUMENTS',
        folders: [
          {
            id: 101,
            name: 'ND01',
            files: [
              { download_id: 'dl-1001', name: 'preview-doc1.pdf', download_uri: 'https://example.com/preview1.pdf' },
              { download_id: 'dl-1002', name: 'preview-doc2.pdf', download_uri: 'https://example.com/preview2.pdf' },
            ],
          },
        ],
      },
    ];

    it('uses download_id as key fallback when id is missing', () => {
      render(
        <DocumentsListingPreview
          projects={projectsWithDownloadIdOnly}
          onDownload={mockOnDownload}
          state="snapshot_preview"
        />
      );

      expect(screen.getByText('preview-doc1.pdf')).toBeInTheDocument();
      expect(screen.getByText('preview-doc2.pdf')).toBeInTheDocument();
    });

    it('disables button using download_id when downloadingFileId matches download_id', () => {
      render(
        <DocumentsListingPreview
          projects={projectsWithDownloadIdOnly}
          onDownload={mockOnDownload}
          state="snapshot_preview"
          downloadingFileId="dl-1001"
        />
      );

      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      expect(iconButtons[0]).toBeDisabled();
      expect(iconButtons[1]).not.toBeDisabled();
    });

    it('shows circular progress on the row whose download_id is downloading', () => {
      render(
        <DocumentsListingPreview
          projects={projectsWithDownloadIdOnly}
          onDownload={mockOnDownload}
          state="snapshot_preview"
          downloadingFileId="dl-1002"
        />
      );

      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
    });

    it('renders error state keyed by download_id', () => {
      render(
        <DocumentsListingPreview
          projects={projectsWithDownloadIdOnly}
          onDownload={mockOnDownload}
          state="snapshot_preview"
          downloadErrors={{ 'dl-1001': true }}
        />
      );

      expect(screen.getByText('Unable to download')).toBeInTheDocument();
    });

    it('passes file with only download_id to onDownload callback', () => {
      render(
        <DocumentsListingPreview
          projects={projectsWithDownloadIdOnly}
          onDownload={mockOnDownload}
          state="snapshot_preview"
          downloadingFileId={null}
        />
      );

      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      fireEvent.click(iconButtons[0]);

      expect(mockOnDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          download_id: 'dl-1001',
          name: 'preview-doc1.pdf',
        }),
        'ND01',
        'PROJECT SPECIFIC DOCUMENTS',
        'snapshot_preview'
      );
    });
  });

  describe('Default Prop Behavior', () => {
    it('renders without crashing when projects prop is omitted', () => {
      render(<DocumentsListingPreview />);
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();
    });

    it('renders nothing when projects prop is omitted (default to empty array)', () => {
      const { container } = render(<DocumentsListingPreview />);
      expect(container.querySelectorAll('[data-testid="accordion"]')).toHaveLength(0);
    });
  });

  describe('Undefined files array fallback', () => {
    it('renders "0 Files" count when folder.files is undefined', () => {
      const projectsWithUndefinedFiles = [
        {
          id: 1,
          name: 'Test Project',
          folders: [
            { id: 101, name: 'No Files Defined' },
          ],
        },
      ];

      render(
        <DocumentsListingPreview
          projects={projectsWithUndefinedFiles}
          onDownload={mockOnDownload}
          state="snapshot_preview"
        />
      );

      expect(screen.getByText('No Files Defined')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element.textContent === '0 Files';
      })).toBeInTheDocument();
      expect(screen.queryByTestId(/^download-manager-file-download-/)).not.toBeInTheDocument();
    });

    it('does not crash when folder.files is undefined and folder is expanded', () => {
      const projectsWithUndefinedFiles = [
        {
          id: 1,
          name: 'Test Project',
          folders: [
            { id: 101, name: 'Empty Folder' },
          ],
        },
      ];

      const { container } = render(
        <DocumentsListingPreview
          projects={projectsWithUndefinedFiles}
          onDownload={mockOnDownload}
          state="snapshot_preview"
        />
      );

      expect(container.querySelector('[data-testid="download-manager-folder-101"]')).toBeInTheDocument();
    });
  });
});
