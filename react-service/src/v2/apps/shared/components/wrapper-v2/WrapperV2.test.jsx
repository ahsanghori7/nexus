import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Paper from '@mui/material/Paper';
import Wrapper from './index';

jest.mock('v1/global/components/Loading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));

jest.mock('v1/global/components/InfoBoxes', () => ({
  HelpBox: () => <div data-testid="help-box">Help Box Content</div>,
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        lightPeriwinkle: '#E6E8F0',
      },
    },
  },
}));

describe('Wrapper Component', () => {
  const defaultProps = {
    header: <div>Header Content</div>,
    leftContent: <div>Left Content</div>,
  };

  test('renders error alert when error is true', () => {
    render(<Wrapper {...defaultProps} error={true} />);

    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while fetching the form data.')).toBeInTheDocument();
    // The component still renders content when error is true
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  test('renders custom error message when provided', () => {
    const customErrorMessage = 'Custom error occurred';
    render(<Wrapper {...defaultProps} error={true} errorMessage={customErrorMessage} />);

    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    expect(screen.getByText(customErrorMessage)).toBeInTheDocument();
  });

  test('renders loading component when loading is true', () => {
    render(<Wrapper {...defaultProps} loading={true} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-error')).not.toBeInTheDocument();
    expect(screen.queryByText('Header Content')).not.toBeInTheDocument();
  });

  test('renders content when not loading and no error', () => {
    render(<Wrapper {...defaultProps} />);

    expect(screen.queryByTestId('alert-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Left Content')).toBeInTheDocument();
  });

  test('renders centerContent when provided', () => {
    const centerContent = <div>Center Content</div>;
    render(<Wrapper {...defaultProps} centerContent={centerContent} />);

    expect(screen.getByText('Center Content')).toBeInTheDocument();
    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Left Content')).toBeInTheDocument();
  });

  test('renders rightContent when provided', () => {
    const rightContent = <div>Right Content</div>;
    render(<Wrapper {...defaultProps} rightContent={rightContent} />);

    expect(screen.getByText('Right Content')).toBeInTheDocument();
    expect(screen.getByTestId('help-box')).toBeInTheDocument();
  });

  test('renders helpText as warning alert when provided with rightContent', () => {
    const helpText = 'This is helpful information';
    const rightContent = <div>Right Content</div>;
    render(<Wrapper {...defaultProps} rightContent={rightContent} helpText={helpText} />);

    expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
    expect(screen.getByText(helpText)).toBeInTheDocument();
  });

  test('renders helpText with custom severity', () => {
    const helpText = 'This is helpful information';
    const rightContent = <div>Right Content</div>;
    render(<Wrapper {...defaultProps} rightContent={rightContent} helpText={helpText} severity="info" />);

    const alertElement = screen.getByTestId('alert-warning');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('MuiAlert-standardInfo');
  });

  test('uses custom component when provided', () => {
    const CustomComponent = ({ children, ...props }) => (
      <div data-testid="custom-component" {...props}>
        {children}
      </div>
    );
    render(<Wrapper {...defaultProps} component={CustomComponent} />);

    expect(screen.getByTestId('custom-component')).toBeInTheDocument();
  });

  test('uses custom headerComponent when provided with rightContent', () => {
    const CustomHeader = () => <div data-testid="custom-header">Custom Header</div>;
    const rightContent = <div>Right Content</div>;
    render(<Wrapper {...defaultProps} rightContent={rightContent} headerComponent={<CustomHeader />} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.queryByTestId('help-box')).not.toBeInTheDocument();
  });

  test('handles empty props gracefully', () => {
    render(<Wrapper />);

    expect(screen.queryByTestId('alert-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('help-box')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-warning')).not.toBeInTheDocument();
  });

  test('applies default props correctly', () => {
    const helpText = 'Default severity test';
    const rightContent = <div>Right Content</div>;
    render(<Wrapper rightContent={rightContent} helpText={helpText} />);

    const alertElement = screen.getByTestId('alert-warning');
    expect(alertElement).toHaveClass('MuiAlert-standardWarning');
  });

  test('renders both error and content when error is true', () => {
    render(<Wrapper {...defaultProps} error={true} />);

    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Left Content')).toBeInTheDocument();
  });
});