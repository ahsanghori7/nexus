import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the config dependencies to avoid import errors
jest.mock('./config', () => ({
  admin: { name: 'admin' },
  adminProsper: { name: 'adminProsper' },
  prosper: { name: 'prosper' },
  clink: { name: 'clink' },
}));

import { useContext, contextConf } from './index';

// Test component that uses the hook
const TestComponent = ({ contextType }) => {
  const context = useContext(contextType);
  return (
    <div data-testid="test-component">
      {context ? 'Context loaded' : 'No context'}
    </div>
  );
};

describe('useContext hook', () => {
  it('should render without crashing', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should use admin context by default', () => {
    render(<TestComponent />);
    expect(screen.getByText('Context loaded')).toBeInTheDocument();
  });

  it('should accept context parameter', () => {
    render(<TestComponent contextType="admin" />);
    expect(screen.getByText('Context loaded')).toBeInTheDocument();
  });

  it('should handle different context types', () => {
    const contexts = ['admin', 'adminProsper', 'prosper', 'clink'];
    
    contexts.forEach(contextType => {
      const { unmount } = render(<TestComponent contextType={contextType} />);
      expect(screen.getByText('Context loaded')).toBeInTheDocument();
      unmount();
    });
  });

  it('should export contextConf', () => {
    expect(contextConf).toBeDefined();
    expect(typeof contextConf).toBe('object');
  });

  it('should handle undefined context gracefully', () => {
    render(<TestComponent contextType={undefined} />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should handle non-existent context type', () => {
    render(<TestComponent contextType="nonexistent" />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});