import React from 'react';
import { render, screen } from '@testing-library/react';
import AIInfoTooltip from './AIInfoTooltip';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('@mui/material/Box', () => ({ children, ...props }) => (
  <div {...props}>{children}</div>
));

jest.mock('@mui/material/Typography', () => ({ children, ...props }) => (
  <span {...props}>{children}</span>
));

jest.mock('@mui/material/Tooltip', () => {
  // eslint-disable-next-line react/display-name
  return jest.fn(({ children, title }) => (
    <div>
      {children}
      <div data-testid="tooltip-content">{title}</div>
    </div>
  ));
});

jest.mock('@mui/icons-material/InfoOutlined', () => () => <span>InfoIcon</span>);

describe('AIInfoTooltip', () => {
  it('renders label and icon for ineligible state', () => {
    render(
      <AIInfoTooltip
        aiState="ineligible"
        reasons={['insufficient_quotes']}
      />,
    );

    expect(screen.getByText('ineligible-tooltip')).toBeInTheDocument();
    expect(screen.getByText('InfoIcon')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'tooltip-ineligible-title',
    );
  });

  it('renders limitations label for eligible state', () => {
    render(<AIInfoTooltip aiState="eligible" reasons={[]} />);

    expect(screen.getByText('eligible-tooltip')).toBeInTheDocument();
    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toHaveTextContent('tooltip-eligible-title');
    expect(tooltipContent).toHaveTextContent('tooltip-eligible-section-filesize');
    expect(tooltipContent).toHaveTextContent('tooltip-eligible-filesize-word');
    expect(tooltipContent).toHaveTextContent('tooltip-eligible-filesize-txt');
    expect(tooltipContent).toHaveTextContent('tooltip-eligible-section-analysis');
    expect(tooltipContent).toHaveTextContent('tooltip-eligible-section-notes');
  });

  it('renders limitations variant regardless of aiState', () => {
    render(
      <AIInfoTooltip
        aiState="ineligible"
        reasons={['boq']}
        variant="limitations"
      />,
    );

    expect(screen.getByText('eligible-tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'tooltip-eligible-title',
    );
    expect(screen.getByTestId('tooltip-content')).not.toHaveTextContent(
      'tooltip-ineligible-title',
    );
  });
});
