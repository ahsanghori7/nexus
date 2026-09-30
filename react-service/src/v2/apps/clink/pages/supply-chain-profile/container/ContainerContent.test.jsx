import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContainerContent from './ContainerContent';

// Mock the child components that are complex
jest.mock('v2/apps/clink/pages/supply-chain-profile/CompanyDetailsForm', () => {
  return function MockCompanyDetailsForm() {
    return <div data-testid="company-details-form">Company Details Form</div>;
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/PreqDocsAndRefs', () => {
  return function MockPreqDocsAndRefs() {
    return <div data-testid="preq-docs-and-refs">Preq Docs And Refs</div>;
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/tab-forms/CompanyOfferingForm', () => {
  return function MockCompanyOfferingForm() {
    return <div data-testid="company-offering-form">Company Offering Form</div>;
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/QualityAndExample', () => {
  return function MockQualityAndExample() {
    return <div data-testid="quality-and-example">Quality And Example</div>;
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/health-safety-and-environmental/HealthSafetyAndEnvContainer', () => {
  return function MockHealthSafetyAndEnvironmental() {
    return <div data-testid="health-safety-env">Health Safety Environmental</div>;
  };
});

describe('ContainerContent', () => {
  const defaultProps = {
    aid: 'test-aid',
    contextType: 'clink',
    prequalification: {
      TUR: {},
      INF: {},
      ORG: {},
    },
    company: {
      details: {},
      logos: {},
      offering: {},
    },
  };

  it('renders without crashing', () => {
    render(<ContainerContent {...defaultProps} />);
    expect(screen.getByTestId('company-details-form')).toBeInTheDocument();
  });

  it('renders all expected components', () => {
    render(<ContainerContent {...defaultProps} />);
    
    expect(screen.getByTestId('company-details-form')).toBeInTheDocument();
    expect(screen.getByTestId('preq-docs-and-refs')).toBeInTheDocument();
    expect(screen.getByTestId('company-offering-form')).toBeInTheDocument();
    expect(screen.getByTestId('quality-and-example')).toBeInTheDocument();
    expect(screen.getByTestId('health-safety-env')).toBeInTheDocument();
  });

  it('handles missing props gracefully', () => {
    render(<ContainerContent />);
    expect(screen.getByTestId('company-details-form')).toBeInTheDocument();
  });

  it('renders with different contextType', () => {
    const props = { ...defaultProps, contextType: 'prosper' };
    render(<ContainerContent {...props} />);
    expect(screen.getByTestId('company-details-form')).toBeInTheDocument();
  });
});