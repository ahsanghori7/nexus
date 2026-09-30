import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Accordion from './Accordion';

// Mock all MUI components
jest.mock('@mui/material/Accordion', () => {
  return function MockAccordion({ children, expanded, onChange }) {
    return (
      <div data-testid="mui-accordion" data-expanded={expanded}>
        <div onClick={onChange} data-testid="accordion-toggle">
          Toggle
        </div>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/AccordionSummary', () => {
  return function MockAccordionSummary({ children, expandIcon }) {
    return (
      <div data-testid="mui-accordion-summary">
        {children}
        <div data-testid="expand-icon">{expandIcon}</div>
      </div>
    );
  };
});

jest.mock('@mui/material/IconButton', () => {
  return function MockIconButton({ children, size }) {
    return (
      <button data-testid="mui-icon-button" data-size={size}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, sx }) {
    return <div data-testid="mui-typography" style={sx}>{children}</div>;
  };
});

jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, sx, id }) {
    return <div data-testid="mui-box" style={sx} id={id}>{children}</div>;
  };
});

jest.mock('@mui/icons-material', () => ({
  Remove: function MockRemoveIcon() {
    return <span data-testid="remove-icon">−</span>;
  },
  Add: function MockAddIcon() {
    return <span data-testid="add-icon">+</span>;
  },
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e0e0e0',
      },
    },
  },
}));

describe('SimpleAccordion', () => {
  const defaultProps = {
    title: 'Test Accordion',
    id: 'test-accordion',
  };

  it('renders without crashing', () => {
    render(
      <Accordion {...defaultProps}>
        <div>Test content</div>
      </Accordion>
    );
    
    expect(screen.getByTestId('mui-accordion')).toBeInTheDocument();
  });

  it('renders title correctly', () => {
    render(<Accordion {...defaultProps} />);
    
    expect(screen.getByText('Test Accordion')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <Accordion {...defaultProps}>
        <div data-testid="accordion-content">Test content</div>
      </Accordion>
    );
    
    expect(screen.getByTestId('accordion-content')).toBeInTheDocument();
  });

  it('starts expanded by default', () => {
    render(
      <Accordion {...defaultProps}>
        <div>Test content</div>
      </Accordion>
    );
    
    // Should start expanded (true)
    expect(screen.getByTestId('mui-accordion')).toHaveAttribute('data-expanded', 'true');
    // Should show remove icon when expanded
    expect(screen.getByTestId('remove-icon')).toBeInTheDocument();
  });

  it('toggles expanded state when clicked', () => {
    render(
      <Accordion {...defaultProps}>
        <div>Test content</div>
      </Accordion>
    );
    
    // Initially expanded, should show remove icon
    expect(screen.getByTestId('remove-icon')).toBeInTheDocument();
    
    // Click toggle
    fireEvent.click(screen.getByTestId('accordion-toggle'));
    
    // Should now be collapsed and show add icon
    expect(screen.getByTestId('add-icon')).toBeInTheDocument();
  });

  it('applies correct id to container', () => {
    render(
      <Accordion {...defaultProps}>
        <div>Test content</div>
      </Accordion>
    );
    
    expect(document.getElementById('test-accordion')).toBeInTheDocument();
  });

  it('renders without children', () => {
    render(<Accordion {...defaultProps} />);
    
    expect(screen.getByText('Test Accordion')).toBeInTheDocument();
    // Should render without crashing even with no children
  });

  it('handles empty title', () => {
    render(
      <Accordion id="test">
        <div>Test content</div>
      </Accordion>
    );
    
    // Should render without errors even with empty title
    expect(screen.getByTestId('mui-accordion')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Accordion {...defaultProps}>
        <div>Test content</div>
      </Accordion>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});