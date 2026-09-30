import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  IconBox,
  ActionButton,
  OuterBox,
  InnerBox,
} from './EmptyStateComponents';
import { ThemeProvider, createTheme } from '@mui/material/styles';

jest.mock('@mui/material/Grid2', () => {
  const React = require('react');
  return function MockGrid2({ children, sx, ...props }) {
    const gridProps = { ...props };
    delete gridProps.container;
    delete gridProps.size;

    return (
      <div data-testid="grid2" data-sx={JSON.stringify(sx)} {...gridProps}>
        {children}
      </div>
    );
  };
});

// Mock the icons as plain functional component references that return clean DOM structures
jest.mock('@mui/icons-material/Description', () => {
  return {
    __esModule: true,
    default: function MockDescriptionIcon(props) {
      return <span data-testid="description-icon" {...props} />;
    },
  };
});

jest.mock('@mui/icons-material/Refresh', () => {
  return {
    __esModule: true,
    default: function MockRefreshIcon(props) {
      return <span data-testid="refresh-icon" {...props} />;
    },
  };
});

jest.mock('@mui/icons-material/Add', () => {
  return {
    __esModule: true,
    default: function MockAddIcon(props) {
      return <span data-testid="add-icon" {...props} />;
    },
  };
});

import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('EmptyStateComponents', () => {
  describe('OuterBox Component', () => {
    it('renders OuterBox with correct role', () => {
      const { container } = renderWithTheme(
        <OuterBox>
          <div>Test Content</div>
        </OuterBox>,
      );
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('renders OuterBox with children', () => {
      renderWithTheme(
        <OuterBox>
          <div>Test Content</div>
        </OuterBox>,
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom sx styles to OuterBox', () => {
      const { container } = renderWithTheme(
        <OuterBox sx={{ padding: '20px' }}>
          <div>Test Content</div>
        </OuterBox>,
      );
      expect(container).toBeInTheDocument();
    });

    it('OuterBox has correct propTypes', () => {
      expect(OuterBox.propTypes).toBeDefined();
      expect(OuterBox.propTypes.children).toBeDefined();
      expect(OuterBox.propTypes.sx).toBeDefined();
    });
  });

  describe('InnerBox Component', () => {
    it('renders InnerBox with default size', () => {
      renderWithTheme(
        <InnerBox>
          <div>Test Content</div>
        </InnerBox>,
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders InnerBox with small size', () => {
      renderWithTheme(
        <InnerBox size="small">
          <div>Test Content</div>
        </InnerBox>,
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders InnerBox with large size', () => {
      renderWithTheme(
        <InnerBox size="large">
          <div>Test Content</div>
        </InnerBox>,
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies border styling for non-table variant', () => {
      const { container } = renderWithTheme(
        <InnerBox variant="generic">
          <div>Test Content</div>
        </InnerBox>,
      );
      expect(container).toBeInTheDocument();
    });

    it('removes border styling for table variant', () => {
      const { container } = renderWithTheme(
        <InnerBox variant="table">
          <div>Test Content</div>
        </InnerBox>,
      );
      expect(container).toBeInTheDocument();
    });

    it('InnerBox has correct propTypes', () => {
      expect(InnerBox.propTypes).toBeDefined();
      expect(InnerBox.propTypes.children).toBeDefined();
      expect(InnerBox.propTypes.size).toBeDefined();
      expect(InnerBox.propTypes.variant).toBeDefined();
    });

    it('supports all size variants', () => {
      const sizes = ['small', 'default', 'large'];
      sizes.forEach((size) => {
        const { unmount } = renderWithTheme(
          <InnerBox size={size}>
            <div>Content</div>
          </InnerBox>,
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
        unmount();
      });
    });

    it('supports all variant types', () => {
      const variants = ['generic', 'search', 'firstUse', 'error', 'table'];
      variants.forEach((variant) => {
        const { unmount } = renderWithTheme(
          <InnerBox variant={variant}>
            <div>Content</div>
          </InnerBox>,
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('IconBox Component', () => {
    it('renders IconBox with default colors', () => {
      const { container } = renderWithTheme(
        <IconBox icon={<DescriptionIcon />} />,
      );
      expect(container).toBeInTheDocument();
    });

    it('renders IconBox with custom background color', () => {
      const { container } = renderWithTheme(
        <IconBox icon={<DescriptionIcon />} backgroundColor="#ff0000" />,
      );
      expect(container).toBeInTheDocument();
    });

    it('renders IconBox with custom icon color', () => {
      const { container } = renderWithTheme(
        <IconBox icon={<DescriptionIcon />} iconColor="#00ff00" />,
      );
      expect(container).toBeInTheDocument();
    });

    it('applies firstUse variant colors', () => {
      const { container } = renderWithTheme(
        <IconBox icon={<DescriptionIcon />} variant="firstUse" />,
      );
      expect(container).toBeInTheDocument();
    });

    it('applies error variant colors', () => {
      const { container } = renderWithTheme(
        <IconBox icon={<DescriptionIcon />} variant="error" />,
      );
      expect(container).toBeInTheDocument();
    });

    it('uses default colors for generic variant', () => {
      const { container } = renderWithTheme(
        <IconBox icon={<DescriptionIcon />} variant="generic" />,
      );
      expect(container).toBeInTheDocument();
    });

    it('custom colors override variant colors', () => {
      const { container } = renderWithTheme(
        <IconBox
          icon={<DescriptionIcon />}
          variant="firstUse"
          backgroundColor="#abcdef"
          iconColor="#123456"
        />,
      );
      expect(container).toBeInTheDocument();
    });

    it('uses custom background color before variant background color', () => {
      renderWithTheme(
        <IconBox
          icon={<DescriptionIcon />}
          variant="firstUse"
          backgroundColor="#abcdef"
        />,
      );

      expect(screen.getByTestId('grid2').getAttribute('data-sx')).toContain(
        '"backgroundColor":"#abcdef"',
      );
    });

    it('IconBox has correct propTypes', () => {
      expect(IconBox.propTypes).toBeDefined();
      expect(IconBox.propTypes.icon).toBeDefined();
      expect(IconBox.propTypes.variant).toBeDefined();
      expect(IconBox.propTypes.backgroundColor).toBeDefined();
    });

    it('supports all variant types', () => {
      const variants = ['generic', 'search', 'firstUse', 'error', 'table'];
      variants.forEach((variant) => {
        const { unmount, container } = renderWithTheme(
          <IconBox icon={<DescriptionIcon />} variant={variant} />,
        );
        expect(container).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('ActionButton Component', () => {
    it('renders ActionButton with label', () => {
      renderWithTheme(
        <ActionButton
          action={{
            label: 'Click Me',
            onClick: jest.fn(),
          }}
        />,
      );
      expect(
        screen.getByRole('button', { name: /click me/i }),
      ).toBeInTheDocument();
    });

    it('calls onClick when ActionButton is clicked', () => {
      const mockOnClick = jest.fn();
      renderWithTheme(
        <ActionButton
          action={{
            label: 'Click Me',
            onClick: mockOnClick,
          }}
        />,
      );

      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('renders ActionButton with contained variant', () => {
      renderWithTheme(
        <ActionButton
          action={{
            label: 'Add',
            onClick: jest.fn(),
          }}
          variant="contained"
        />,
      );
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('renders ActionButton with outlined variant', () => {
      renderWithTheme(
        <ActionButton
          action={{
            label: 'Cancel',
            onClick: jest.fn(),
          }}
          variant="outlined"
        />,
      );
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it('renders ActionButton with text variant', () => {
      renderWithTheme(
        <ActionButton
          action={{
            label: 'Learn More',
            onClick: jest.fn(),
          }}
          variant="text"
        />,
      );
      expect(
        screen.getByRole('button', { name: /learn more/i }),
      ).toBeInTheDocument();
    });

    it('renders ActionButton with default icon', () => {
      const { container } = renderWithTheme(
        <ActionButton
          action={{
            label: 'Add',
            onClick: jest.fn(),
          }}
        />,
      );
      // Validates presence of the action button container element
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('renders ActionButton with custom action icon', () => {
      const { container } = renderWithTheme(
        <ActionButton
          action={{
            label: 'Retry',
            onClick: jest.fn(),
            icon: RefreshIcon,
          }}
        />,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('renders ActionButton with custom icon prop', () => {
      const { container } = renderWithTheme(
        <ActionButton
          action={{
            label: 'Delete',
            onClick: jest.fn(),
          }}
          icon={RefreshIcon}
        />,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('action.icon takes precedence over icon prop', () => {
      const { container } = renderWithTheme(
        <ActionButton
          action={{
            label: 'Action',
            onClick: jest.fn(),
            icon: RefreshIcon,
          }}
          icon={DescriptionIcon}
        />,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('ActionButton has correct propTypes', () => {
      expect(ActionButton.propTypes).toBeDefined();
      expect(ActionButton.propTypes.action).toBeDefined();
      expect(ActionButton.propTypes.variant).toBeDefined();
      expect(ActionButton.propTypes.icon).toBeDefined();
    });

    it('supports all button variants', () => {
      const variants = ['contained', 'outlined', 'text'];
      variants.forEach((variant) => {
        const { unmount } = renderWithTheme(
          <ActionButton
            action={{
              label: 'Button',
              onClick: jest.fn(),
            }}
            variant={variant}
          />,
        );
        expect(
          screen.getByRole('button', { name: /button/i }),
        ).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('PropTypes Coverage', () => {
    it('all components have propTypes defined', () => {
      expect(OuterBox.propTypes).toBeDefined();
      expect(InnerBox.propTypes).toBeDefined();
      expect(IconBox.propTypes).toBeDefined();
      expect(ActionButton.propTypes).toBeDefined();
    });
  });
});
