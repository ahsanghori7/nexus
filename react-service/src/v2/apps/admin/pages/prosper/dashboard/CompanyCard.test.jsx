import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyCard from './CompanyCard';

// Mock the necessary modules
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/helpers/url', () => ({
  getProjectLogo: jest.fn((projectId) => `logo-${projectId}.png`),
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((amount, config) => `$${amount}`),
  currencyConfig: {
    USD: { symbol: '$', format: 'USD' },
  },
}));

jest.mock('v2/apps/shared/components/cards/small/OpportunityCard', () => {
  return function MockOpportunityCard({ theme, item }) {
    return (
      <div data-testid="opportunity-card" data-theme={theme}>
        <div data-testid="project-image">{item.projectImage}</div>
        <div data-testid="project-name">{item.projectName}</div>
        <div data-testid="project-company">{item.projectCompany}</div>
        <div data-testid="project-name2">{item.projectName2}</div>
        <div data-testid="project-pack">{item.projectPack}</div>
        <div data-testid="project-date">{item.projectDate}</div>
        <div data-testid="token-amount">{item.tokenAmount}</div>
        <div data-testid="token-cost">{item.tokenCost}</div>
      </div>
    );
  };
});

describe('CompanyCard', () => {
  const mockElem = {
    projectId: 'proj-123',
    project: 'Test Project',
    company: 'Test Company',
    projectName2: 'Secondary Name',
    pack: 'Premium Pack',
    date: '2023-10-15',
    tokenAmount: 100,
    cost: 50.75,
  };

  it('should render without crashing', () => {
    render(<CompanyCard elem={mockElem} />);
    
    expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
  });

  it('should pass correct theme to OpportunityCard', () => {
    render(<CompanyCard elem={mockElem} />);
    
    const card = screen.getByTestId('opportunity-card');
    expect(card).toHaveAttribute('data-theme', 'prosper-analytics-card');
  });

  it('should display project information correctly', () => {
    render(<CompanyCard elem={mockElem} />);
    
    expect(screen.getByTestId('project-image')).toHaveTextContent('logo-proj-123.png');
    expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project');
    expect(screen.getByTestId('project-company')).toHaveTextContent('Test Company');
    expect(screen.getByTestId('project-name2')).toHaveTextContent('Secondary Name');
    expect(screen.getByTestId('project-pack')).toHaveTextContent('Premium Pack');
    expect(screen.getByTestId('project-date')).toHaveTextContent('2023-10-15');
    expect(screen.getByTestId('token-amount')).toHaveTextContent('100');
    expect(screen.getByTestId('token-cost')).toHaveTextContent('$50.75');
  });

  it('should handle elem without cost', () => {
    const elemWithoutCost = { ...mockElem };
    delete elemWithoutCost.cost;
    
    render(<CompanyCard elem={elemWithoutCost} />);
    
    expect(screen.getByTestId('token-cost')).toHaveTextContent('');
  });

  it('should match snapshot', () => {
    const { container } = render(<CompanyCard elem={mockElem} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});