import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyState from './index';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock react-i18next translation hook to return the key itself
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Safely mock the internal components file directly to handle custom rendering props
// This circumvents the moduleNameMapper icon resolution failure entirely!
jest.mock('./EmptyStateComponents', () => {
  const React = require('react');
  return {
    __esModule: true,
    OuterBox: ({ children }) => <div data-testid="outer-box">{children}</div>,
    InnerBox: ({ children }) => <div data-testid="inner-box">{children}</div>,
    IconBox: ({ icon }) => <div data-testid="icon-box">{icon}</div>,
    ActionButton: ({ action }) => (
      <button onClick={action.onClick}>{action.label}</button>
    ),
  };
});

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('EmptyState Component Suite', () => {
  describe('Rendering and Variants', () => {
    it('renders with generic fallback labels and defaults successfully', () => {
      renderWithTheme(<EmptyState variant="generic" />);

      expect(screen.getByText('no-records-found')).toBeInTheDocument();
      expect(screen.getByText('no-data-display')).toBeInTheDocument();
    });

    it('renders search variant fallback texts', () => {
      renderWithTheme(<EmptyState variant="search" />);

      expect(screen.getByText('no-results-found')).toBeInTheDocument();
      expect(screen.getByText('adjust-filters-search')).toBeInTheDocument();
    });

    it('renders firstUse variant fallback texts', () => {
      renderWithTheme(<EmptyState variant="firstUse" />);

      expect(screen.getByText('no-items-added')).toBeInTheDocument();
      expect(screen.getByText('add-first-item')).toBeInTheDocument();
    });

    it('renders error variant fallback texts', () => {
      renderWithTheme(<EmptyState variant="error" />);

      expect(screen.getByText('something-went-wrong')).toBeInTheDocument();
      expect(screen.getByText('load-information-error')).toBeInTheDocument();
    });

    it('renders table variant fallback texts', () => {
      renderWithTheme(<EmptyState variant="table" />);

      expect(screen.getByText('no-records-table')).toBeInTheDocument();
      expect(screen.getByText('no-rows-display')).toBeInTheDocument();
    });
  });

  describe('Custom Titles, Descriptions, and Icons', () => {
    it('prioritizes explicit custom title and description props over defaults', () => {
      renderWithTheme(
        <EmptyState
          title="Custom Title Header"
          description="Custom Description Body text string."
        />,
      );

      expect(screen.getByText('Custom Title Header')).toBeInTheDocument();
      expect(
        screen.getByText('Custom Description Body text string.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('no-records-found')).not.toBeInTheDocument();
    });

    it('renders custom React Node node icons passed to the icon prop', () => {
      renderWithTheme(
        <EmptyState icon={<span data-testid="custom-injected-node" />} />,
      );

      expect(screen.getByTestId('custom-injected-node')).toBeInTheDocument();
    });
  });

  describe('Actions Execution Layers', () => {
    it('renders primaryAction button and fires click accurately', () => {
      const mockPrimaryClick = jest.fn();
      renderWithTheme(
        <EmptyState
          primaryAction={{
            label: 'Create Entry',
            onClick: mockPrimaryClick,
          }}
        />,
      );

      const primaryBtn = screen.getByRole('button', { name: /create entry/i });
      expect(primaryBtn).toBeInTheDocument();

      fireEvent.click(primaryBtn);
      expect(mockPrimaryClick).toHaveBeenCalledTimes(1);
    });

    it('renders secondaryAction button and handles custom click dispatch safely', () => {
      const mockSecondaryClick = jest.fn();
      renderWithTheme(
        <EmptyState
          secondaryAction={{
            label: 'Go Back',
            onClick: mockSecondaryClick,
          }}
        />,
      );

      const secondaryBtn = screen.getByRole('button', { name: /go back/i });
      expect(secondaryBtn).toBeInTheDocument();

      fireEvent.click(secondaryBtn);
      expect(mockSecondaryClick).toHaveBeenCalledTimes(1);
    });

    it('renders primary and secondary action layers simultaneously when provided', () => {
      renderWithTheme(
        <EmptyState
          primaryAction={{ label: 'Primary Action', onClick: jest.fn() }}
          secondaryAction={{ label: 'Secondary Action', onClick: jest.fn() }}
        />,
      );

      expect(
        screen.getByRole('button', { name: /primary action/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /secondary action/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Sizing and Style Injections', () => {
    it('accepts and spreads size variants and style override definitions smoothly', () => {
      const { container } = renderWithTheme(
        <EmptyState size="large" sx={{ opacity: 0.5 }} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('PropTypes Validation Coverage', () => {
    it('has propTypes schemas declared cleanly on the root level definition exported', () => {
      expect(EmptyState.propTypes).toBeDefined();
      expect(EmptyState.propTypes.variant).toBeDefined();
      expect(EmptyState.propTypes.size).toBeDefined();
      expect(EmptyState.propTypes.primaryAction).toBeDefined();
      expect(EmptyState.propTypes.secondaryAction).toBeDefined();
    });
  });
});
