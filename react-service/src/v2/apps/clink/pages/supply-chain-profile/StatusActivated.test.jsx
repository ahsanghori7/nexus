import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusActivated from './StatusActivated';

describe('StatusActivated', () => {
  it('renders without crashing', () => {
    render(<StatusActivated isActivated={false} />);
    expect(screen.getByTestId('grid2')).toBeInTheDocument();
  });

  it('displays activated status when isActivated is true', () => {
    render(<StatusActivated isActivated={true} />);
    expect(screen.getByTestId('verified-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('remove-icon')).not.toBeInTheDocument();
  });

  it('displays not activated status when isActivated is false', () => {
    render(<StatusActivated isActivated={false} />);
    expect(screen.getByTestId('remove-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('verified-icon')).not.toBeInTheDocument();
  });

  it('renders with correct tooltip title for activated state', () => {
    render(<StatusActivated isActivated={true} />);
    const tooltip = screen.getByTestId('mui-tooltip');
    expect(tooltip).toHaveAttribute('data-title', 'Activated');
  });

  it('renders with correct tooltip title for not activated state', () => {
    render(<StatusActivated isActivated={false} />);
    const tooltip = screen.getByTestId('mui-tooltip');
    expect(tooltip).toHaveAttribute('data-title', 'Not Activated');
  });
});
