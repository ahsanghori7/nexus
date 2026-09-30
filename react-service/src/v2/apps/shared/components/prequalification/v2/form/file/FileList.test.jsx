import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import FileList from './FileList';

// Mock the url helpers
jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn(),
  getUrl: jest.fn(() => 'mock-url'),
}));

jest.mock('@mui/material', () => {
  const React = require('react');

  return {
    List: ({ children }) => <ul data-testid="file-list">{children}</ul>,
    ListItem: ({ children, ...props }) => (
      <li data-testid="file-list-item" {...props}>
        {children}
      </li>
    ),
    ListItemText: ({ primary, onClick, style }) => (
      <span
        data-testid="file-list-text"
        onClick={onClick}
        style={style}
      >
        {primary}
      </span>
    ),
    ListItemSecondaryAction: ({ children }) => (
      <div data-testid="file-list-secondary">{children}</div>
    ),
    IconButton: ({ children, onClick, ...props }) => (
      <button
        type="button"
        data-testid="file-list-delete"
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    ),
  };
});

describe('FileList', () => {
  const mockRemoveFile = jest.fn();
  const mockFiles = [
    {
      original_file: 'document1.pdf',
      document: 'doc1',
    },
    {
      original_file: 'document2.docx',
      document: 'doc2',
    },
    {
      original_file: 'very_long_filename_that_exceeds_the_maximum_length_limit.pdf',
      document: 'doc3',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<FileList />);
    expect(container).toBeInTheDocument();
  });

  it('renders empty list when no files provided', () => {
    render(<FileList files={[]} removeFile={mockRemoveFile} />);
    const list = screen.getByTestId('file-list');
    expect(list.children).toHaveLength(0);
  });

  it('renders list items for each file', () => {
    render(<FileList files={mockFiles} removeFile={mockRemoveFile} />);
    const listItems = screen.getAllByTestId('file-list-item');
    expect(listItems).toHaveLength(3);
  });

  it('displays full filename when under max length', () => {
    render(<FileList files={[mockFiles[0]]} removeFile={mockRemoveFile} />);
    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
  });

  it('truncates long filenames with ellipsis', () => {
    render(<FileList files={[mockFiles[2]]} removeFile={mockRemoveFile} />);
    const truncatedText = 'very_long_filename_that_exceeds_the_maxi...';
    expect(screen.getByText(truncatedText)).toBeInTheDocument();
  });

  it('renders delete button for each file', () => {
    render(<FileList files={mockFiles} removeFile={mockRemoveFile} />);
    const deleteButtons = screen.getAllByTestId('file-list-delete');
    expect(deleteButtons).toHaveLength(3);
  });

  it('calls removeFile when delete button is clicked', () => {
    render(<FileList files={mockFiles} removeFile={mockRemoveFile} />);
    const deleteButton = screen.getAllByTestId('file-list-delete')[0];
    fireEvent.click(deleteButton);
    expect(mockRemoveFile).toHaveBeenCalledTimes(1);
  });

  it('handles null file original_file property', () => {
    const filesWithNull = [
      { original_file: null, document: 'doc1' },
      { original_file: undefined, document: 'doc2' },
    ];
    
    render(<FileList files={filesWithNull} removeFile={mockRemoveFile} />);
    const listItems = screen.getAllByTestId('file-list-item');
    expect(listItems).toHaveLength(2);
  });

  it('handles file click when getDocInfo is provided', () => {
    const { goToNewTab, getUrl } = require('v2/helpers/url');
    const mockGetDocInfo = [true, 'aid123', 'docid456'];

    render(
      <FileList
        files={[mockFiles[0]]}
        removeFile={mockRemoveFile}
        getDocInfo={mockGetDocInfo}
      />
    );

    const fileText = screen.getByText('document1.pdf');
    fireEvent.click(fileText);
    
    expect(getUrl).toHaveBeenCalledWith(
      'APP_PROSPER',
      '/relay/v1/prequalification/aid123/download/docid456'
    );
    expect(goToNewTab).toHaveBeenCalledWith('mock-url');
  });

  it('does not open file when getDocInfo document is false', () => {
    const { goToNewTab } = require('v2/helpers/url');
    const mockGetDocInfo = [false, 'aid123', 'docid456'];

    render(
      <FileList
        files={[mockFiles[0]]}
        removeFile={mockRemoveFile}
        getDocInfo={mockGetDocInfo}
      />
    );

    const fileText = screen.getByText('document1.pdf');
    fireEvent.click(fileText);
    
    expect(goToNewTab).not.toHaveBeenCalled();
  });
});
