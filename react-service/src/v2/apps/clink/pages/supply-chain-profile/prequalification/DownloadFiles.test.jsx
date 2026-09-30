import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadFiles from './DownloadFiles';

// Mock the url helper
jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((appName, path) => `mocked-url-${appName}-${path}`),
}));

describe('DownloadFiles', () => {
  const defaultProps = {
    aid: 'test-aid-123',
    label: 'Download Test Files',
    type: 'test-type',
  };

  it('renders without crashing', () => {
    render(<DownloadFiles {...defaultProps} />);
    expect(screen.getByTestId('mui-grid')).toBeInTheDocument();
  });

  it('displays the correct label', () => {
    render(<DownloadFiles {...defaultProps} />);
    expect(screen.getByText('Download Test Files')).toBeInTheDocument();
  });

  it('renders with different label text', () => {
    const props = { ...defaultProps, label: 'Custom Download Label' };
    render(<DownloadFiles {...props} />);
    expect(screen.getByText('Custom Download Label')).toBeInTheDocument();
  });

  it('handles missing props gracefully', () => {
    render(<DownloadFiles />);
    expect(screen.getByTestId('mui-grid')).toBeInTheDocument();
  });

  it('renders with different aid and type', () => {
    const props = {
      aid: 'different-aid',
      label: 'Different Files',
      type: 'different-type',
    };
    render(<DownloadFiles {...props} />);
    expect(screen.getByText('Different Files')).toBeInTheDocument();
  });

  it('renders a download button', () => {
    render(<DownloadFiles {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href');
  });
});