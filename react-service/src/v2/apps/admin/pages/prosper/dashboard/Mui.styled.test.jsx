import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MuiDashboardCardContainer, MuiCompanyCardContainer } from './Mui.styled';

describe('MuiDashboardCardContainer', () => {
  it('should render without crashing', () => {
    render(
      <MuiDashboardCardContainer>
        <div>Test Content</div>
      </MuiDashboardCardContainer>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children correctly', () => {
    render(
      <MuiDashboardCardContainer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </MuiDashboardCardContainer>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should render with supplyChain prop', () => {
    render(
      <MuiDashboardCardContainer supplyChain={true}>
        <div>Supply Chain Content</div>
      </MuiDashboardCardContainer>
    );
    
    expect(screen.getByText('Supply Chain Content')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(
      <MuiDashboardCardContainer>
        <div>Snapshot Test</div>
      </MuiDashboardCardContainer>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('MuiCompanyCardContainer', () => {
  it('should render without crashing', () => {
    render(
      <MuiCompanyCardContainer>
        <div>Company Content</div>
      </MuiCompanyCardContainer>
    );
    
    expect(screen.getByText('Company Content')).toBeInTheDocument();
  });

  it('should render children correctly', () => {
    render(
      <MuiCompanyCardContainer>
        <div data-testid="company-child">Company Child</div>
      </MuiCompanyCardContainer>
    );
    
    expect(screen.getByTestId('company-child')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(
      <MuiCompanyCardContainer>
        <div>Company Snapshot</div>
      </MuiCompanyCardContainer>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});