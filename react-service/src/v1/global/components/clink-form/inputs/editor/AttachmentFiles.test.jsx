import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttachmentFiles from './AttachmentFiles';

describe('AttachmentFiles', () => {
  const mockFiles = [
    { name: 'document.pdf', type: 'application/pdf' },
    { name: 'image.jpg', type: 'image/jpeg' },
    { name: 'text.txt', type: 'text/plain' },
  ];
  const mockRemoveFile = jest.fn();

  it('renders without crashing', () => {
    render(<AttachmentFiles files={mockFiles} removeFile={mockRemoveFile} />);
  });


  it('calls removeFile when the badge is clicked', () => {
    render(<AttachmentFiles files={mockFiles} removeFile={mockRemoveFile} />);
    const removeButtons = screen.getByTestId('remove-file-0');
    const removeButtons1 = screen.getByTestId('remove-file-1');
    const removeButtons2 = screen.getByTestId('remove-file-2');
    fireEvent.click(removeButtons);
    expect(mockRemoveFile).toHaveBeenCalledWith('document.pdf');
    fireEvent.click(removeButtons1);
    expect(mockRemoveFile).toHaveBeenCalledWith('image.jpg');
    fireEvent.click(removeButtons2);
    expect(mockRemoveFile).toHaveBeenCalledWith('text.txt');

  });

  it('applies the className prop', () => {
    const className = 'test-class';
    render(<AttachmentFiles files={mockFiles} removeFile={mockRemoveFile} className={className} />);
    const element = screen.getByTestId('list');
    expect(element).toHaveClass(className);
  });

  it('renders FileIcon component', () => {
    render(<AttachmentFiles files={mockFiles} removeFile={mockRemoveFile} />);
    expect(screen.getByTestId('document.pdf-0')).toBeInTheDocument();
    expect(screen.getByTestId('image.jpg-1')).toBeInTheDocument();
    expect(screen.getByTestId('text.txt-2')).toBeInTheDocument();
  });
});
