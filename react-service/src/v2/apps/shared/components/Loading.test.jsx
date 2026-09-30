import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading from './Loading';

// Mock i18next translation function
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn().mockReturnValue('Loading...'),
  }),
}));

// Mock clink-components Status component
jest.mock('clink-components', () => ({
  Status: ({ severity, message }) => (
    <div data-testid="status" data-severity={severity}>
      {message}
    </div>
  ),
  CONSTANTS: {
    colors: {
      general: {
        boqAccent: '#14A38B',
        clinkLightPurple: '#DDE0F5',
        darkCharcoal: '#222222',
      },
    },
  },
}));

describe('Loading Component', () => {
  test('renders without crashing when status is provided', () => {
    render(<Loading status="info" />);
    
    const statusElement = screen.getByTestId('status');
    expect(statusElement).toBeInTheDocument();
  });

  test('does not render when status is not provided', () => {
    // Create a wrapper component to handle the falsy return value
    const TestWrapper = () => {
      const result = Loading({});
      return result || <div data-testid="no-status">No status</div>;
    };
    
    render(<TestWrapper />);
    
    const statusElement = screen.queryByTestId('status');
    const noStatusElement = screen.queryByTestId('no-status');
    
    expect(statusElement).not.toBeInTheDocument();
    expect(noStatusElement).toBeInTheDocument();
  });

  test('renders with info severity when status is not error', () => {
    render(<Loading status="success" />);
    
    const statusElement = screen.getByTestId('status');
    expect(statusElement).toHaveAttribute('data-severity', 'info');
  });

  test('renders with error severity when status is error', () => {
    render(<Loading status="error" />);
    
    const statusElement = screen.getByTestId('status');
    expect(statusElement).toHaveAttribute('data-severity', 'error');
  });

  test('uses custom message when provided', () => {
    const customMessage = 'Custom loading message';
    render(<Loading status="info" message={customMessage} />);
    
    const statusElement = screen.getByTestId('status');
    expect(statusElement).toHaveTextContent(customMessage);
  });

  test('uses translated message when no custom message provided', () => {
    render(<Loading status="info" />);
    
    const statusElement = screen.getByTestId('status');
    expect(statusElement).toHaveTextContent('Loading...');
  });

  test('renders correctly with various status values', () => {
    const statuses = ['loading', 'pending', 'processing'];
    
    statuses.forEach(status => {
      const { unmount } = render(<Loading status={status} />);
      
      const statusElement = screen.getByTestId('status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('data-severity', 'info');
      
      unmount();
    });
  });

  test('renders custom BoQ loading banner for BoQ list loading', () => {
    render(<Loading status="Loading BoQ list" />);
    expect(screen.getByTestId('boq-loading-banner')).toBeInTheDocument();
    // Custom banner should not render generic Status component
    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
  });

  test('renders custom BoQ loading banner for BoQ entity updating', () => {
    render(<Loading status="Updating BoQ Entity" />);
    expect(screen.getByTestId('boq-loading-banner')).toBeInTheDocument();
    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
  });

  test('covers hexAlpha 3-digit hex path', async () => {
    jest.resetModules();
    jest.doMock('react-i18next', () => ({
      useTranslation: () => ({ t: () => 'Loading...' }),
    }));
    jest.doMock('clink-components', () => ({
      Status: () => <div data-testid="status" />,
      CONSTANTS: {
        colors: { general: { boqAccent: '#abc', clinkLightPurple: '#ddd', darkCharcoal: '#111' } },
      },
    }));
    const { default: LoadingIsolated } = await import('./Loading');
    render(<LoadingIsolated status="Loading BoQ list" />);
    expect(screen.getByTestId('boq-loading-banner')).toBeInTheDocument();
  });

  test('covers hexAlpha invalid hex path (returns original)', async () => {
    jest.resetModules();
    jest.doMock('react-i18next', () => ({
      useTranslation: () => ({ t: () => 'Loading...' }),
    }));
    jest.doMock('clink-components', () => ({
      Status: () => <div data-testid="status" />,
      CONSTANTS: {
        colors: { general: { boqAccent: '12', clinkLightPurple: '#ddd', darkCharcoal: '#111' } },
      },
    }));
    const { default: LoadingIsolated } = await import('./Loading');
    render(<LoadingIsolated status="Loading BoQ list" />);
    expect(screen.getByTestId('boq-loading-banner')).toBeInTheDocument();
  });
});