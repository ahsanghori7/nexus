import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BoqContainer, Item, TenderSummaryLeft, TenderSummaryRight } from './mui';
import Grid from '@mui/material/Grid';
import { BrowserRouter } from 'react-router-dom';

// Mock the CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkBackgroundPurple: '#f8f9fa',
        clinkLightPurple: '#e9ecef',
        clinkGreen: '#28a745',
        clinkRed: '#dc3545'
      }
    }
  }
}));

// Mock the goToNewTab helper
jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn()
}));

// Mock DemoButton to avoid Redux store dependency
jest.mock('v2/apps/shared/components/demo-button', () => {
  return function MockDemoButton({ type, handleClick }) {
    return <button data-testid={`demo-button-${type}`} onClick={handleClick}>Demo Button {type}</button>;
  };
});

describe('mui styled components', () => {
  describe('BoqContainer', () => {
    it('renders children correctly', () => {
      render(
        <BoqContainer>
          <div data-testid="test-child">Test content</div>
        </BoqContainer>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toHaveTextContent('Test content');
    });

    it('has correct container id', () => {
      const { container } = render(
        <BoqContainer>
          <div>Test</div>
        </BoqContainer>
      );
      
      expect(container.querySelector('#container-resize-ta')).toBeInTheDocument();
    });
  });

  describe('Item', () => {
    it('renders children with default props', () => {
      render(
        <Grid container>
          <Item>
            <div data-testid="item-child">Item content</div>
          </Item>
        </Grid>
      );
      
      expect(screen.getByTestId('item-child')).toBeInTheDocument();
    });

    it('renders with custom itemProps', () => {
      render(
        <Grid container>
          <Item itemProps={{ xs: 6, sm: 3 }}>
            <div data-testid="custom-item">Custom item</div>
          </Item>
        </Grid>
      );
      
      expect(screen.getByTestId('custom-item')).toBeInTheDocument();
    });
  });

  describe('TenderSummaryLeft', () => {
    it('renders children correctly', () => {
      render(
        <Grid container>
          <TenderSummaryLeft>
            <div data-testid="left-child">Left content</div>
          </TenderSummaryLeft>
        </Grid>
      );
      
      expect(screen.getByTestId('left-child')).toBeInTheDocument();
    });
  });

  describe('TenderSummaryRight', () => {
    it('renders children correctly', () => {
      render(
        <BrowserRouter>
          <Grid container>
            <TenderSummaryRight>
              <div data-testid="right-child">Right content</div>
            </TenderSummaryRight>
          </Grid>
        </BrowserRouter>
      );
      
      expect(screen.getByTestId('right-child')).toBeInTheDocument();
    });

    it('renders with arrayLength and boqid props', () => {
      render(
        <BrowserRouter>
          <Grid container>
            <TenderSummaryRight arrayLength={5} boqid={123}>
              <div data-testid="right-child-props">Right content with props</div>
            </TenderSummaryRight>
          </Grid>
        </BrowserRouter>
      );
      
      expect(screen.getByTestId('right-child-props')).toBeInTheDocument();
    });
  });
});