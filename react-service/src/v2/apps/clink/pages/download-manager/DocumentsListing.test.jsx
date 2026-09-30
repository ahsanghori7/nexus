import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DocumentsListing from './DocumentsListing';

// Mock i18next
jest.mock('i18next', () => ({
  t: (key) => {
    const translations = {
      'file-name': 'File Name',
      'actions': 'Actions',
      'file': 'File',
      'files': 'Files',
      'download': 'Download',
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
        eerieBlack: '#1B1B1B',
        darkCharcoal: '#333333',
        white: '#FFFFFF',
        clinkBackgroundPurple: '#F5F5FF',
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

jest.mock('@mui/material/Button', () => ({ children, onClick, startIcon, variant, ...props }) => (
  <button data-testid="mui-button" data-variant={variant} onClick={onClick} {...props}>
    {startIcon}
    {children}
  </button>
));

jest.mock('@mui/material/Dialog', () => ({ children, open, onClose, maxWidth, fullWidth }) => (
  open ? (
    <div data-testid="dialog" data-maxwidth={maxWidth} data-fullwidth={fullWidth.toString()}>
      {children}
    </div>
  ) : null
));

jest.mock('@mui/material/Divider', () => ({ sx }) => <hr data-testid="divider" />);

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

jest.mock('@mui/material/IconButton', () => ({ children, onClick, size, ...props }) => (
  <button data-testid="icon-button" data-size={size} onClick={onClick} {...props}>
    {children}
  </button>
));

jest.mock('@mui/material/Tooltip', () => ({ children, title }) => (
  <div data-testid="tooltip" title={title}>
    {children}
  </div>
));

describe('DocumentsListing', () => {
  const mockProjects = [
    {
      id: 1,
      name: 'Project Specific Documents',
      folders: [
        {
          id: 101,
          name: 'ND01',
          files: [
            { id: 1001, name: 'document1.pdf' },
            { id: 1002, name: 'document2.pdf' },
          ],
        },
        {
          id: 102,
          name: 'ND02',
          files: [
            { id: 1003, name: 'document3.pdf' },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Additional Documents',
      folders: [
        {
          id: 201,
          name: 'Architectural',
          files: [
            { id: 2001, name: 'arch-doc.pdf' },
          ],
        },
      ],
    },
  ];

  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DocumentsListing Component', () => {
    it('renders without crashing', () => {
      render(<DocumentsListing projects={[]} onDownload={mockOnDownload} />);
      expect(screen.getByTestId('download-manager-documents-listing')).toBeInTheDocument();
    });

    it('renders all projects', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByText('Project Specific Documents')).toBeInTheDocument();
      expect(screen.getByText('Additional Documents')).toBeInTheDocument();
    });

    it('renders all folders within projects', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByText('ND01')).toBeInTheDocument();
      expect(screen.getByText('ND02')).toBeInTheDocument();
      expect(screen.getByText('Architectural')).toBeInTheDocument();
    });

    it('renders correct file count for each folder', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByText((content, element) => {
        return element.textContent === '2 Files';
      })).toBeInTheDocument();
      const singleFileTexts = screen.getAllByText((content, element) => {
        return element.textContent === '1 File';
      });
      expect(singleFileTexts.length).toBeGreaterThan(0);
    });

    it('handles empty projects array', () => {
      render(<DocumentsListing projects={[]} onDownload={mockOnDownload} />);
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();
    });

    it('handles projects with no folders', () => {
      const projectsWithNoFolders = [
        { id: 1, name: 'Empty Project', folders: [] },
      ];
      render(<DocumentsListing projects={projectsWithNoFolders} onDownload={mockOnDownload} />);
      expect(screen.getByText('Empty Project')).toBeInTheDocument();
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();
    });

  });

  describe('FolderAccordion Component', () => {
    it('renders folder name and file count', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const folder = mockProjects[0].folders[0];
      expect(screen.getByText(folder.name)).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element.textContent === '2 Files';
      })).toBeInTheDocument();
    });

    it('displays singular "file" for single file', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const singleFileTexts = screen.getAllByText((content, element) => {
        return element.textContent === '1 File';
      });
      expect(singleFileTexts.length).toBeGreaterThan(0);
    });

    it('expands first folder by default', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const accordions = screen.getAllByTestId(/^download-manager-folder-/);
      expect(accordions[0]).toHaveAttribute('data-expanded', 'true');
    });

    it('does not expand subsequent folders by default', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const accordions = screen.getAllByTestId(/^download-manager-folder-/);
      expect(accordions[1]).toHaveAttribute('data-expanded', 'false');
    });

    it('toggles expansion when clicked', async () => {
      const user = userEvent.setup();
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      
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
      render(<DocumentsListing projects={projectsWithEmptyFolder} onDownload={mockOnDownload} />);
      expect(screen.getByText((content, element) => {
        return element.textContent === '0 Files';
      })).toBeInTheDocument();
    });
  });

  describe('FilesTable Component', () => {
    it('renders table headers', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const fileNameHeaders = screen.getAllByText('File Name');
      const actionsHeaders = screen.getAllByText('Actions');
      expect(fileNameHeaders.length).toBeGreaterThan(0);
      expect(actionsHeaders.length).toBeGreaterThan(0);
    });

    it('renders all files in expanded folder', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
      expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    });

    it('renders download buttons for each file', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const iconButtons = screen.getAllByTestId(/^download-manager-file-download-/);
      expect(iconButtons.length).toBeGreaterThan(0);
    });

    it('calls onDownload when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      
      const downloadButton = screen.getByTestId('download-manager-file-download-1001');
      
      await user.click(downloadButton);
      
      expect(mockOnDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
        }),
        expect.any(String)
      );
    });

    it('renders file icon for each file', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      const fileIcons = screen.getAllByTestId('insert-drive-file-outlined-icon');
      expect(fileIcons.length).toBeGreaterThan(0);
    });
  });

  describe('FilePreviewModal Component', () => {
    it('does not render when no file is selected', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('data-testid attributes', () => {
    it('root box has download-manager-documents-listing testid', () => {
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByTestId('download-manager-documents-listing')).toBeInTheDocument();
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
      render(<DocumentsListing projects={mockProjects} onDownload={mockOnDownload} />);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onDownload prop', () => {
      render(<DocumentsListing projects={mockProjects} />);
      expect(screen.getByText('Project Specific Documents')).toBeInTheDocument();
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
                { id: 1001, name: 'file-with-dashes.pdf' },
                { id: 1002, name: 'file_with_underscores.pdf' },
                { id: 1003, name: 'file (with) parens.pdf' },
              ],
            },
          ],
        },
      ];
      render(<DocumentsListing projects={projectsWithSpecialChars} onDownload={mockOnDownload} />);
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
                },
              ],
            },
          ],
        },
      ];
      render(<DocumentsListing projects={projectsWithLongNames} onDownload={mockOnDownload} />);
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
      render(<DocumentsListing projects={projectsWithDuplicateFolderNames} onDownload={mockOnDownload} />);
      const documentsFolders = screen.getAllByText('Documents');
      expect(documentsFolders).toHaveLength(2);
    });
  });
});
