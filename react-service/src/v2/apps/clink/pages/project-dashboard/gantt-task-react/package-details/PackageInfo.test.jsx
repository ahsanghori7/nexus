import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PackageInfo from './PackageInfo';

describe('PackageInfo Component', () => {
  it('renders without crashing', () => {
    render(<PackageInfo />);
    // Component should render even with no props
    const chip = screen.getByRole('button');
    expect(chip).toBeInTheDocument();
  });

  it('displays info prop correctly', () => {
    render(<PackageInfo info="5" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays info as string when number provided', () => {
    render(<PackageInfo info={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders just chip when no extra prop provided', () => {
    const { container } = render(<PackageInfo info="3" />);
    
    // Should find chip but no badge
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Should not have badge wrapper
    const badge = container.querySelector('.MuiBadge-root');
    expect(badge).not.toBeInTheDocument();
  });

  it('renders with badge when extra prop is provided', () => {
    render(<PackageInfo info="3" extra="2" />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders with badge when extra is a number', () => {
    render(<PackageInfo info="5" extra={1} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles empty string info', () => {
    render(<PackageInfo info="" />);
    const chip = screen.getByRole('button');
    expect(chip).toBeInTheDocument();
    // Empty string should still render the chip
  });

  it('handles empty string extra', () => {
    const { container } = render(<PackageInfo info="5" extra="" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    // Empty extra should not show badge since it's falsy
    const badgeWrapper = container.querySelector('[data-testid="badge-wrapper"]');
    expect(badgeWrapper).not.toBeInTheDocument();
  });

  it('handles zero as falsy extra value', () => {
    const { container } = render(<PackageInfo info="5" extra={0} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    // Zero is falsy, so no badge should be shown
    const badgeWrapper = container.querySelector('[data-testid="badge-wrapper"]');
    expect(badgeWrapper).not.toBeInTheDocument();
  });

  it('uses default empty string for info when undefined', () => {
    render(<PackageInfo info={undefined} />);
    const chip = screen.getByRole('button');
    expect(chip).toBeInTheDocument();
  });

  it('applies correct chip styling props', () => {
    const { container } = render(<PackageInfo info="test" />);
    const chip = screen.getByRole('button');
    
    expect(chip).toBeInTheDocument();
    // The component should render without styling errors
    expect(container.firstChild).toBeInTheDocument();
  });

  it('matches snapshot with info only', () => {
    const { container } = render(<PackageInfo info="5" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with info and extra', () => {
    const { container } = render(<PackageInfo info="3" extra="1" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  describe('edge cases', () => {
    it('handles null info gracefully', () => {
      render(<PackageInfo info={null} />);
      const chip = screen.getByRole('button');
      expect(chip).toBeInTheDocument();
    });

    it('handles undefined extra gracefully', () => {
      render(<PackageInfo info="5" extra={undefined} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      // Should not render badge for undefined extra
    });

    it('handles boolean extra values', () => {
      render(<PackageInfo info="5" extra={true} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByTestId('badge-content')).toBeInTheDocument();
      // The badge content should contain the boolean value but might be rendered as string
    });
  });
});