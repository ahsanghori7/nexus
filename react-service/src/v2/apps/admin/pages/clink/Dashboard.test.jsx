import React from 'react';
import { render } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dashboard />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null as expected', () => {
    const result = Dashboard();
    expect(result).toBeNull();
  });
});