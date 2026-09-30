import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  MuiScrollerContainer,
  MuiInsuranceBox,
  MuiDownloadBox,
  MuiReferenceBox,
  MuiEmptyReferenceBox,
} from '../prequalification/mui.styled';

// Mock constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#green',
        clinkRed: '#red',
        brightGray: '#brightgray',
        lightPeriwinkle: '#lightperiwinkle',
        white: '#white',
        japaneseIndigo: '#japaneseindigo',
      },
    },
  },
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, sx, ...props }) {
    return (
      <div {...props} data-testid="mui-box" data-sx={JSON.stringify(sx)}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Grid', () => {
  return function MockGrid({ children, sx, item, xs, lg, md, padding, ...props }) {
    return (
      <div
        {...props}
        data-testid="mui-grid"
        data-sx={JSON.stringify(sx)}
        data-item={item}
        data-xs={xs}
        data-lg={lg}
        data-md={md}
        data-padding={padding}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, sx, ...props }) {
    return (
      <div {...props} data-testid="mui-typography" data-sx={JSON.stringify(sx)}>
        {children}
      </div>
    );
  };
});

describe('Prequalification MUI Styled Components', () => {
  describe('MuiScrollerContainer', () => {
    it('should render children without accordion', () => {
      render(
        <MuiScrollerContainer>
          <div>Test content</div>
        </MuiScrollerContainer>
      );
      expect(screen.getByTestId('mui-box')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render children with accordion prop', () => {
      render(
        <MuiScrollerContainer accordion>
          <div>Test content</div>
        </MuiScrollerContainer>
      );
      expect(screen.getByTestId('mui-box')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('MuiInsuranceBox', () => {
    it('should render children without accordion', () => {
      render(
        <MuiInsuranceBox>
          <div>Insurance content</div>
        </MuiInsuranceBox>
      );
      expect(screen.getByTestId('mui-grid')).toBeInTheDocument();
      expect(screen.getByText('Insurance content')).toBeInTheDocument();
    });

    it('should render children with accordion prop', () => {
      render(
        <MuiInsuranceBox accordion>
          <div>Insurance content</div>
        </MuiInsuranceBox>
      );
      const grid = screen.getByTestId('mui-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('data-item', 'true');
      expect(grid).toHaveAttribute('data-xs', '12');
      expect(grid).toHaveAttribute('data-lg', '3');
      expect(screen.getByText('Insurance content')).toBeInTheDocument();
    });
  });

  describe('MuiDownloadBox', () => {
    it('should render children without accordion', () => {
      render(
        <MuiDownloadBox>
          <div>Download content</div>
        </MuiDownloadBox>
      );
      expect(screen.getByTestId('mui-box')).toBeInTheDocument();
      expect(screen.getByText('Download content')).toBeInTheDocument();
    });

    it('should render children with accordion prop', () => {
      render(
        <MuiDownloadBox accordion>
          <div>Download content</div>
        </MuiDownloadBox>
      );
      expect(screen.getByTestId('mui-box')).toBeInTheDocument();
      expect(screen.getByText('Download content')).toBeInTheDocument();
    });
  });

  describe('MuiReferenceBox', () => {
    it('should render children without accordion', () => {
      render(
        <MuiReferenceBox>
          <div>Reference content</div>
        </MuiReferenceBox>
      );
      const grid = screen.getByTestId('mui-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('data-item', 'true');
      expect(grid).toHaveAttribute('data-xs', '12');
      expect(grid).toHaveAttribute('data-md', '6');
      expect(screen.getByText('Reference content')).toBeInTheDocument();
    });

    it('should render children with accordion prop', () => {
      render(
        <MuiReferenceBox accordion>
          <div>Reference content</div>
        </MuiReferenceBox>
      );
      expect(screen.getByTestId('mui-grid')).toBeInTheDocument();
      expect(screen.getByText('Reference content')).toBeInTheDocument();
    });
  });

  describe('MuiEmptyReferenceBox', () => {
    it('should render children', () => {
      render(
        <MuiEmptyReferenceBox>
          <div>Empty reference content</div>
        </MuiEmptyReferenceBox>
      );
      const grid = screen.getByTestId('mui-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('data-item', 'true');
      expect(grid).toHaveAttribute('data-xs', '12');
      expect(screen.getByText('Empty reference content')).toBeInTheDocument();
    });

    it('should render with typography component', () => {
      render(
        <MuiEmptyReferenceBox>
          Empty reference
        </MuiEmptyReferenceBox>
      );
      expect(screen.getByTestId('mui-typography')).toBeInTheDocument();
      expect(screen.getByText('Empty reference')).toBeInTheDocument();
    });
  });
});