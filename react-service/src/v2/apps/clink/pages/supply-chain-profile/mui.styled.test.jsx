import React from 'react';
import { render, screen } from '@testing-library/react';
import { MuiPanel, MuiSectionTitle, MuiAccordionTitle, MuiAccreditationLabel } from './mui.styled';

// Mock MUI components
jest.mock('@mui/material/Card', () => {
  return function MockCard({ id, sx, children }) {
    return (
      <div 
        data-testid="mui-card" 
        id={id}
        style={sx}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Box', () => {
  return function MockBox({ sx, children }) {
    return (
      <div 
        data-testid="mui-box" 
        style={sx}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ sx, children }) {
    return (
      <div 
        data-testid="mui-typography" 
        style={sx}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/CardMedia', () => {
  return function MockCardMedia({ sx, image }) {
    return (
      <div 
        data-testid="mui-card-media" 
        style={sx}
        data-image={image}
      />
    );
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconCloseGray: 'mocked-icon-url',
      iconCloseRed: 'mocked-icon-red-url'
    },
    colors: {
      general: {
        clinkLightPurple: '#E8E0FF',
        black: '#000000',
        white: '#FFFFFF',
        gray2: '#E0E0E0'
      }
    }
  }
}));

// Mock other dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key
}));

jest.mock('v2/apps/shared/components/dialog', () => {
  return function MockDialog({ children }) {
    return <div data-testid="mock-dialog">{children}</div>;
  };
});

jest.mock('@mui/material/useMediaQuery', () => () => false);

jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({})
}));

describe('mui.styled components', () => {
  describe('MuiPanel', () => {
    it('should render with default padding', () => {
      render(
        <MuiPanel>
          <div>Test content</div>
        </MuiPanel>
      );
      
      const card = screen.getByTestId('mui-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('id', 'mui-panel');
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render with custom padding', () => {
      render(
        <MuiPanel p={2}>
          <div>Test content</div>
        </MuiPanel>
      );
      
      const card = screen.getByTestId('mui-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render with custom sx styles', () => {
      const customSx = { backgroundColor: 'red', margin: '10px' };
      
      render(
        <MuiPanel sx={customSx}>
          <div>Test content</div>
        </MuiPanel>
      );
      
      const card = screen.getByTestId('mui-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render with no children', () => {
      render(<MuiPanel />);
      
      const card = screen.getByTestId('mui-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('MuiSectionTitle', () => {
    it('should render title with children', () => {
      render(
        <MuiSectionTitle>
          Test Title
        </MuiSectionTitle>
      );
      
      const box = screen.getByTestId('mui-box');
      expect(box).toBeInTheDocument();
      expect(box).toHaveStyle({ 
        display: 'flex', 
        justifyContent: 'space-between' 
      });
      
      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render title with rightContent', () => {
      const rightContent = <button>Right Button</button>;
      
      render(
        <MuiSectionTitle rightContent={rightContent}>
          Test Title
        </MuiSectionTitle>
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Right Button')).toBeInTheDocument();
      
      const boxes = screen.getAllByTestId('mui-box');
      expect(boxes).toHaveLength(2); // Main box and rightContent box
    });

    it('should render title without rightContent', () => {
      render(
        <MuiSectionTitle>
          Test Title Only
        </MuiSectionTitle>
      );
      
      expect(screen.getByText('Test Title Only')).toBeInTheDocument();
      
      const boxes = screen.getAllByTestId('mui-box');
      expect(boxes).toHaveLength(1); // Only main box
    });

    it('should handle empty children', () => {
      render(<MuiSectionTitle />);
      
      const box = screen.getByTestId('mui-box');
      expect(box).toBeInTheDocument();
      
      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
    });
  });

  describe('MuiAccordionTitle', () => {
    it('should render with children text', () => {
      render(<MuiAccordionTitle>Accordion Title</MuiAccordionTitle>);
      
      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toHaveStyle({ 
        fontSize: '14px', 
        color: '#E0E0E0' 
      });
      expect(screen.getByText('Accordion Title')).toBeInTheDocument();
    });

    it('should render with empty children', () => {
      render(<MuiAccordionTitle />);
      
      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
    });

    it('should render with complex children', () => {
      render(
        <MuiAccordionTitle>
          <span>Complex</span> Title
        </MuiAccordionTitle>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('MuiAccreditationLabel', () => {
    it('should render with children text', () => {
      render(<MuiAccreditationLabel>Accreditation Label</MuiAccreditationLabel>);
      
      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toHaveStyle({ 
        fontSize: '14px', 
        marginBottom: '4px' 
      });
      expect(screen.getByText('Accreditation Label')).toBeInTheDocument();
    });

    it('should render with empty children', () => {
      render(<MuiAccreditationLabel />);
      
      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
    });

    it('should render with numeric children', () => {
      render(<MuiAccreditationLabel>{123}</MuiAccreditationLabel>);
      
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should render with JSX children', () => {
      render(
        <MuiAccreditationLabel>
          <strong>Bold</strong> text
        </MuiAccreditationLabel>
      );
      
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('text')).toBeInTheDocument();
    });
  });
});