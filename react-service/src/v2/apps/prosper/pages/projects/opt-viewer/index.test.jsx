import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptViewerPage from './index';

// Test suite for OptViewerPage component
describe('OptViewerPage', () => {
  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      const { container } = render(<OptViewerPage />);
      expect(container).toBeInTheDocument();
    });

    test('renders Grid container with correct styles', () => {
      const { container } = render(<OptViewerPage />);
      const gridContainer = container.firstChild;
      expect(gridContainer).toBeInTheDocument();
    });

    test('renders OptViewer component with discover prop', () => {
      render(<OptViewerPage />);
      const optViewer = screen.getByTestId('mock-opt-viewer');
      expect(optViewer).toBeInTheDocument();
      expect(optViewer).toHaveAttribute('data-discover', 'true');
    });

    test('renders the page title from OptViewer', () => {
      render(<OptViewerPage />);
      expect(screen.getByText('Mock OptViewer Component')).toBeInTheDocument();
    });
  });

  describe('Snapshot Testing', () => {
    test('matches snapshot', () => {
      const { container } = render(<OptViewerPage />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});