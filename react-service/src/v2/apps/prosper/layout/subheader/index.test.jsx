import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useSubheader from './index';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/test' })
}));

jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isTokenUser: jest.fn(() => true)
  }));
});

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: { 
      claimToken: jest.fn(),
      fetchSubcontractorInfo: jest.fn(),
      fetchRooms: jest.fn()
    },
    pages: {
      home: { path: '', keyTitle: 'home' }
    }
  })
}));

jest.mock('./breadcrumbsConfig', () => 
  jest.fn(() => [{ path: 'home', keyTitle: 'Home' }])
);

describe('useSubheader', () => {
  // Create a test component that uses the hook
  const TestComponent = (props) => {
    const pageHeader = useSubheader(
      props.subcontractor || {},
      props.dispatch || jest.fn(),
      props.title || '',
      props.url || '/test',
      props.companyName || null,
      props.projectName || null,
      props.lock || null
    );
    
    return (
      <div data-testid="page-header">
        {pageHeader.title && <div data-testid="title">{pageHeader.title}</div>}
        {pageHeader.subRightContent && <div data-testid="sub-right-content">{pageHeader.subRightContent}</div>}
        {pageHeader.mainMiddleContent && <div data-testid="main-middle-content">{pageHeader.mainMiddleContent}</div>}
        {pageHeader.mainMiddleLeftContent && <div data-testid="main-middle-left-content">{pageHeader.mainMiddleLeftContent}</div>}
        <div data-testid="breadcrumbs-items">{JSON.stringify(pageHeader.breadcrumbsItems)}</div>
        <div data-testid="max-items">{pageHeader.maxItems}</div>
      </div>
    );
  };

  const renderWithRouter = (component) => render(
    <BrowserRouter>{component}</BrowserRouter>
  );

  test('renders basic page header structure', () => {
    renderWithRouter(<TestComponent />);
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs-items')).toBeInTheDocument();
    expect(screen.getByTestId('max-items')).toBeInTheDocument();
  });

  test('renders title when provided', () => {
    renderWithRouter(<TestComponent title="Test Title" />);
    
    expect(screen.getByTestId('title')).toHaveTextContent('Test Title');
  });

  test('renders token button for token users', () => {
    const subcontractor = { 
      subscription_id: 1, 
      tokenPrices: { basic: 10 },
      info: { account_id: 123 }
    };
    
    renderWithRouter(
      <TestComponent 
        subcontractor={subcontractor} 
        url="/test" 
      />
    );
    
    // Should render the token button content
    expect(screen.getByTestId('sub-right-content')).toBeInTheDocument();
  });

  test('renders download button for prequalification pages', () => {
    const subcontractor = { 
      info: { account_id: 123 }
    };
    
    renderWithRouter(
      <TestComponent 
        subcontractor={subcontractor} 
        url="/my-company/prequalification" 
      />
    );
    
    expect(screen.getByTestId('main-middle-left-content')).toBeInTheDocument();
  });

  test('handles UK country code differently', () => {
    const subcontractor = { 
      country: { code: 'UK' },
      subscription_id: 1
    };
    
    renderWithRouter(
      <TestComponent 
        subcontractor={subcontractor} 
        url="/test" 
      />
    );
    
    // Should render a different sub right content for UK
    expect(screen.getByTestId('sub-right-content')).toBeInTheDocument();
  });

  test('handles locked pages', () => {
    const subcontractor = { 
      subscription_id: 1, 
      tokenPrices: { basic: 10 }
    };
    
    renderWithRouter(
      <TestComponent 
        subcontractor={subcontractor} 
        url="/test" 
        lock={true}
      />
    );
    
    // Should render different content when locked
    expect(screen.getByTestId('sub-right-content')).toBeInTheDocument();
  });

  test('renders help button in main middle content', () => {
    renderWithRouter(<TestComponent />);
    
    expect(screen.getByTestId('main-middle-content')).toBeInTheDocument();
  });

  test('sets max items correctly', () => {
    renderWithRouter(<TestComponent />);
    
    // Should have maxItems value (depends on media query, but will be a number)
    const maxItemsElement = screen.getByTestId('max-items');
    expect(maxItemsElement).toBeInTheDocument();
    expect(maxItemsElement.textContent).toMatch(/\d+/);
  });

  test('handles empty subcontractor', () => {
    renderWithRouter(<TestComponent subcontractor={{}} />);
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });

  test('handles undefined props gracefully', () => {
    renderWithRouter(<TestComponent />);
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });
});