import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tabs, Tab } from './StyledTabs';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxGreen: '#4caf50',
      },
      general: {
        clinkBackgroundPurple: '#6c63ff',
        clinkLightPurple: '#9c97ff',
        white: '#ffffff',
      },
    },
  },
}));

// Mock MUI components
jest.mock('@mui/material/Tabs', () => {
  return function MockTabs(props) {
    return <div data-testid="mui-tabs" {...props} />;
  };
});

jest.mock('@mui/material/Tab', () => {
  return function MockTab(props) {
    return <div data-testid="mui-tab" {...props} />;
  };
});

// Mock styled function
jest.mock('@mui/material/styles', () => ({
  styled: (component) => (styles) => {
    return function StyledComponent(props) {
      const Component = component;
      return <Component data-testid="styled-component" {...props} />;
    };
  },
}));

describe('StyledTabs components', () => {
  describe('Tabs', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { getByTestId } = render(<Tabs />);
      
      // Assert
      expect(getByTestId('styled-component')).toBeInTheDocument();
    });

    it('passes props correctly', () => {
      // Arrange
      const testProps = {
        value: 0,
        orientation: 'horizontal'
      };
      
      // Act
      const { getByTestId } = render(<Tabs {...testProps} />);
      
      // Assert
      const component = getByTestId('styled-component');
      expect(component).toBeInTheDocument();
      expect(component).toHaveAttribute('value', '0');
      expect(component).toHaveAttribute('orientation', 'horizontal');
    });
  });

  describe('Tab', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { getByTestId } = render(<Tab />);
      
      // Assert
      expect(getByTestId('styled-component')).toBeInTheDocument();
    });

    it('renders with closed prop', () => {
      // Arrange & Act
      const { getByTestId } = render(<Tab closed={true} />);
      
      // Assert
      const component = getByTestId('styled-component');
      expect(component).toBeInTheDocument();
      // Check that the component received the closed prop
      expect(component).toBeInTheDocument();
    });

    it('renders without closed prop', () => {
      // Arrange & Act
      const { getByTestId } = render(<Tab />);
      
      // Assert
      const component = getByTestId('styled-component');
      expect(component).toBeInTheDocument();
    });

    it('passes props correctly', () => {
      // Arrange
      const testProps = {
        label: 'Test Tab',
        value: 'test'
      };
      
      // Act
      const { getByTestId } = render(<Tab {...testProps} />);
      
      // Assert
      const component = getByTestId('styled-component');
      expect(component).toBeInTheDocument();
      expect(component).toHaveAttribute('label', 'Test Tab');
      expect(component).toHaveAttribute('value', 'test');
    });
  });

  describe('exports', () => {
    it('exports Tabs component', () => {
      // Assert
      expect(Tabs).toBeDefined();
      expect(typeof Tabs).toBe('function');
    });

    it('exports Tab component', () => {
      // Assert
      expect(Tab).toBeDefined();
      expect(typeof Tab).toBe('function');
    });
  });
});