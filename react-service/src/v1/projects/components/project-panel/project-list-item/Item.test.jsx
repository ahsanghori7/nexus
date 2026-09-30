import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Item from './Item';

// Mock the clink-components CONSTANTS
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e5e5e5',
        clinkPurple: '#purple',
      },
    },
  },
}));

// Wrapper component with Router for testing links
const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Item Component', () => {
  it('renders without crashing', () => {
    render(<Item />);
  });

  it('renders children content', () => {
    render(
      <Item>
        <div data-testid="child-content">Child Content</div>
      </Item>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders image content when provided', () => {
    render(
      <Item
        image={<img data-testid="test-image" src="test.jpg" alt="test" />}
      />,
    );
    expect(screen.getByTestId('test-image')).toBeInTheDocument();
  });

  it('renders body content when provided', () => {
    render(
      <Item body={<div data-testid="test-body">Test Body Content</div>} />,
    );
    expect(screen.getByTestId('test-body')).toBeInTheDocument();
  });

  it('renders as a span when no href is provided', () => {
    render(<Item />);
    expect(document.querySelector('span')).toBeInTheDocument();
  });

  it('renders as a Link component when href is provided', () => {
    renderWithRouter(<Item href="/test-link" />);
    expect(document.querySelector('a')).toHaveAttribute('href', '/test-link');
  });

  it('applies correct styles when addProject is true', () => {
    render(<Item addProject />);
    const box = document.querySelector('[class*="MuiBox-root"]');
    // Check if the box has the correct border color
    expect(box).toHaveStyle({ border: '1px solid #4cc0ad' });
  });

  it('maintains default styling when addProject is false', () => {
    render(<Item />);
    const box = document.querySelector('[class*="MuiBox-root"]');
    expect(box).not.toHaveStyle({ border: '1px solid #4cc0ad' });
  });

  it('renders with correct grid breakpoints', () => {
    render(<Item />);
    const gridItem = document.querySelector('[class*="MuiGrid-root"]');
    expect(gridItem).toHaveClass('MuiGrid-grid-xs-12');
    expect(gridItem).toHaveClass('MuiGrid-grid-sm-4');
    expect(gridItem).toHaveClass('MuiGrid-grid-md-3');
    expect(gridItem).toHaveClass('MuiGrid-grid-lg-2');
  });

  describe('Accessibility', () => {
    it('maintains text decoration none for link items', () => {
      renderWithRouter(<Item href="/test" />);
      const link = document.querySelector('a');
      expect(link).toHaveStyle({ textDecoration: 'none' });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty props gracefully', () => {
      render(<Item image={null} body={null} href="" />);
      expect(
        document.querySelector('[class*="MuiBox-root"]'),
      ).toBeInTheDocument();
    });

    it('handles undefined props gracefully', () => {
      render(<Item image={undefined} body={undefined} href={undefined} />);
      expect(
        document.querySelector('[class*="MuiBox-root"]'),
      ).toBeInTheDocument();
    });
  });
});
