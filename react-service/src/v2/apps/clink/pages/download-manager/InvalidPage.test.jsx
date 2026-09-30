import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvalidPage from './InvalidPage';

jest.mock('i18next', () => ({
  t: (key) => key,
}));

describe('InvalidPage', () => {
  it('renders without crashing', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    expect(screen.getByTestId('cancel-outlined-icon')).toBeInTheDocument();
  });

  it('renders the cancel icon with correct styling', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    const icon = screen.getByTestId('cancel-outlined-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('sx');
  });

  it('renders the page title', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    expect(screen.getByText('invalid-access-page-title')).toBeInTheDocument();
  });

  it('renders title with correct variant', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    const typographies = screen.getAllByTestId('mui-typography');
    const title = typographies.find(el => el.getAttribute('variant') === 'h4');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('invalid-access-page-title');
  });

  it('renders first body text', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    expect(screen.getByText('invalid-access-text-1')).toBeInTheDocument();
  });

  it('renders first body text with correct variant', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    const typographies = screen.getAllByTestId('mui-typography');
    const bodyText = typographies.find(el => el.getAttribute('variant') === 'body1');
    expect(bodyText).toBeInTheDocument();
    expect(bodyText).toHaveTextContent('invalid-access-text-1');
  });

  it('renders second body text', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    expect(screen.getByText('invalid-access-text-2')).toBeInTheDocument();
  });

  it('renders second body text with correct variant', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    const typographies = screen.getAllByTestId('mui-typography');
    const bodyText = typographies.find(el => el.getAttribute('variant') === 'body2');
    expect(bodyText).toBeInTheDocument();
    expect(bodyText).toHaveTextContent('invalid-access-text-2');
  });

  it('renders all text elements', () => {
    render(<InvalidPage ownerAccountName="McLaren" />);
    expect(screen.getByText('invalid-access-page-title')).toBeInTheDocument();
    expect(screen.getByText('invalid-access-text-1')).toBeInTheDocument();
    expect(screen.getByText('invalid-access-text-2')).toBeInTheDocument();
  });

  it('renders icon before text content', () => {
    const { container } = render(<InvalidPage ownerAccountName="McLaren" />);
    const icon = container.querySelector('[data-testid="cancel-outlined-icon"]');
    const title = container.querySelector('[data-testid="mui-typography"]');
    
    expect(icon).toBeInTheDocument();
    expect(title).toBeInTheDocument();
  });
});
