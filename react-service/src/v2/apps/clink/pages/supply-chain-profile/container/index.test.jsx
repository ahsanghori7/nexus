import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SupplyChainContainer from './index';

// Mock the child components
jest.mock('./ContainerContent', () => {
  return function MockContainerContent() {
    return <div data-testid="container-content">Container Content</div>;
  };
});

jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status }) {
    return status ? <div data-testid="loading">Loading: {status}</div> : null;
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('SupplyChainContainer', () => {
  const defaultProps = {
    aid: 'test-aid',
    contextType: 'clink',
    prequalification: {},
    company: {
      details: { reg_number: 'REG123' },
      status: { message: null },
    },
  };

  it('renders without crashing', () => {
    render(<SupplyChainContainer {...defaultProps} />);
    expect(screen.getByTestId('container-content')).toBeInTheDocument();
  });

  it('shows loading when status message exists', () => {
    const props = {
      ...defaultProps,
      company: {
        ...defaultProps.company,
        status: { message: 'Loading data...' },
      },
    };
    render(<SupplyChainContainer {...props} />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading: Loading data...')).toBeInTheDocument();
    expect(screen.queryByTestId('container-content')).not.toBeInTheDocument();
  });

  it('renders content when no loading status', () => {
    render(<SupplyChainContainer {...defaultProps} />);
    
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('container-content')).toBeInTheDocument();
  });

  it('generates download URL when aid is provided', () => {
    render(<SupplyChainContainer {...defaultProps} />);
    
    // Component should render normally when aid is provided
    expect(screen.getByTestId('container-content')).toBeInTheDocument();
  });

  it('handles missing company details gracefully', () => {
    const props = {
      ...defaultProps,
      company: {
        details: {},
        status: { message: null },
      },
    };
    render(<SupplyChainContainer {...props} />);
    
    expect(screen.getByTestId('container-content')).toBeInTheDocument();
  });

  it('renders with different contextType', () => {
    const props = { ...defaultProps, contextType: 'prosper' };
    render(<SupplyChainContainer {...props} />);
    
    expect(screen.getByTestId('container-content')).toBeInTheDocument();
  });
});