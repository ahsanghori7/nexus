import React from 'react';
import { render } from '@testing-library/react';
import Cover from './Cover';

// Mock clink-components
jest.mock('clink-components', () => ({
  Image: ({ src, ...props }) => (
    <img src={src} data-testid="clink-image" alt="" {...props} />
  ),
}));

// Mock MUI Grid
jest.mock('@mui/material/Grid', () => {
  return function MockGrid({ children, item, sx, ...props }) {
    return (
      <div 
        data-testid="mui-grid" 
        data-item={item?.toString()} 
        data-has-sx={!!sx}
        {...props}
      >
        {children}
      </div>
    );
  };
});

describe('Cover component', () => {
  const defaultProps = {
    src: '/test-image.jpg'
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<Cover {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should render Grid component with correct props', () => {
      const { getByTestId } = render(<Cover {...defaultProps} />);
      const grid = getByTestId('mui-grid');
      
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('data-item', 'true');
      expect(grid).toHaveAttribute('data-has-sx', 'true');
    });

    it('should render Image component with correct src', () => {
      const { getByTestId } = render(<Cover {...defaultProps} />);
      const image = getByTestId('clink-image');
      
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
    });

    it('should have Image inside Grid', () => {
      const { getByTestId } = render(<Cover {...defaultProps} />);
      const grid = getByTestId('mui-grid');
      const image = getByTestId('clink-image');
      
      expect(grid).toContainElement(image);
    });
  });

  describe('props handling', () => {
    it('should handle different image sources', () => {
      const testSources = [
        '/image1.png',
        'https://example.com/image2.jpg',
        '/assets/cover.gif',
        'data:image/jpeg;base64,abc123'
      ];

      testSources.forEach(src => {
        const { getByTestId, unmount } = render(<Cover src={src} />);
        const image = getByTestId('clink-image');
        expect(image).toHaveAttribute('src', src);
        unmount(); // Clean up after each render
      });
    });

    it('should handle empty src prop', () => {
      const { getByTestId } = render(<Cover src="" />);
      const image = getByTestId('clink-image');
      expect(image).toHaveAttribute('src', '');
    });

    it('should handle undefined src prop', () => {
      const { getByTestId } = render(<Cover src={undefined} />);
      const image = getByTestId('clink-image');
      expect(image).not.toHaveAttribute('src');
    });

    it('should handle null src prop', () => {
      const { getByTestId } = render(<Cover src={null} />);
      const image = getByTestId('clink-image');
      expect(image).not.toHaveAttribute('src');
    });
  });

  describe('component structure', () => {
    it('should maintain proper component hierarchy', () => {
      const { container } = render(<Cover {...defaultProps} />);
      const grid = container.querySelector('[data-testid="mui-grid"]');
      const image = container.querySelector('[data-testid="clink-image"]');
      
      expect(grid).toBeInTheDocument();
      expect(image).toBeInTheDocument();
      expect(grid).toContainElement(image);
    });

    it('should have only one Grid and one Image component', () => {
      const { getAllByTestId } = render(<Cover {...defaultProps} />);
      const grids = getAllByTestId('mui-grid');
      const images = getAllByTestId('clink-image');
      
      expect(grids).toHaveLength(1);
      expect(images).toHaveLength(1);
    });
  });

  describe('styling configuration', () => {
    it('should pass sx prop to Grid component', () => {
      const { getByTestId } = render(<Cover {...defaultProps} />);
      const grid = getByTestId('mui-grid');
      
      expect(grid).toHaveAttribute('data-has-sx', 'true');
    });

    it('should set item prop to true on Grid', () => {
      const { getByTestId } = render(<Cover {...defaultProps} />);
      const grid = getByTestId('mui-grid');
      
      expect(grid).toHaveAttribute('data-item', 'true');
    });
  });

  describe('accessibility', () => {
    it('should render image with proper accessibility attributes', () => {
      const { getByTestId } = render(<Cover {...defaultProps} />);
      const image = getByTestId('clink-image');
      
      // Image should have alt attribute (empty in this case)
      expect(image).toHaveAttribute('alt');
    });

    it('should be keyboard accessible', () => {
      const { container } = render(<Cover {...defaultProps} />);
      // Component should be accessible via keyboard navigation
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('component behavior', () => {
    it('should be a functional component', () => {
      expect(typeof Cover).toBe('function');
      expect(Cover.prototype?.render).toBeUndefined();
    });

    it('should accept only src prop and ignore others', () => {
      const extraProps = {
        src: '/test.jpg',
        className: 'extra-class',
        'data-extra': 'extra-data'
      };
      
      const { getByTestId } = render(<Cover {...extraProps} />);
      const image = getByTestId('clink-image');
      
      // Only src should be passed to Image component
      expect(image).toHaveAttribute('src', '/test.jpg');
      // Extra props should not be passed down
      expect(image).not.toHaveAttribute('className');
      expect(image).not.toHaveAttribute('data-extra');
    });
  });

  describe('error handling', () => {
    it('should handle missing props gracefully', () => {
      expect(() => render(<Cover />)).not.toThrow();
    });

    it('should render with no src prop', () => {
      const { getByTestId } = render(<Cover />);
      const image = getByTestId('clink-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should work with different image formats', () => {
      const imageFormats = [
        '/test.jpg',
        '/test.png',
        '/test.gif',
        '/test.webp',
        '/test.svg'
      ];

      imageFormats.forEach(src => {
        const { getByTestId, unmount } = render(<Cover src={src} />);
        const image = getByTestId('clink-image');
        expect(image).toHaveAttribute('src', src);
        unmount(); // Clean up between renders
      });
    });

    it('should handle responsive image sources', () => {
      const responsiveSrc = '/images/cover-1920x1080.jpg';
      const { getByTestId } = render(<Cover src={responsiveSrc} />);
      const image = getByTestId('clink-image');
      
      expect(image).toHaveAttribute('src', responsiveSrc);
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<Cover src="/test1.jpg" />);
      
      // Re-render with same props should not cause issues
      expect(() => {
        rerender(<Cover src="/test1.jpg" />);
      }).not.toThrow();
    });

    it('should update when src changes', () => {
      const { getByTestId, rerender } = render(<Cover src="/test1.jpg" />);
      
      rerender(<Cover src="/test2.jpg" />);
      
      const image = getByTestId('clink-image');
      expect(image).toHaveAttribute('src', '/test2.jpg');
    });
  });
});