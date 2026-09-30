import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Template from './index';

// Mock components
jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status, message }) {
    return status ? (
      <div data-testid="loading-component">
        <div data-testid="loading-status">{status}</div>
        {message && <div data-testid="loading-message">{message}</div>}
      </div>
    ) : null;
  };
});

jest.mock('../Header', () => {
  return function MockHeader({ children }) {
    return <div data-testid="header-component">{children}</div>;
  };
});

// Mock MUI components
jest.mock('@mui/material/Grid', () => {
  return function MockGrid({ children, container, item, mt, flexDirection, sx }) {
    return (
      <div 
        data-testid="mui-grid" 
        data-container={container} 
        data-item={item}
        data-flex-direction={flexDirection}
        style={sx}
      >
        {children}
      </div>
    );
  };
});

// Mock store reducer
const mockReducer = (state = {}, action) => state;

describe('Template', () => {
  let store;

  beforeEach(() => {
    store = createStore(mockReducer, {
      project: {
        data: null,
        status: null,
      },
    });
  });

  it('renders without crashing with default state', () => {
    render(
      <Provider store={store}>
        <Template />
      </Provider>
    );
    
    // The component renders a Loading component that checks status, but with no status it returns null
    // So we should check that the Loading component is called, but doesn't render anything visible
    expect(screen.queryByTestId('header-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
  });

  it('shows loading component when status is present', () => {
    store = createStore(mockReducer, {
      project: {
        data: null,
        status: 'loading',
      },
    });

    render(
      <Provider store={store}>
        <Template />
      </Provider>
    );
    
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
  });

  it('renders template content when no status and data is present', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: null,
      },
    });

    render(
      <Provider store={store}>
        <Template>
          <div data-testid="template-children">Test content</div>
        </Template>
      </Provider>
    );
    
    expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('header-component')).toBeInTheDocument();
    expect(screen.getByTestId('template-children')).toBeInTheDocument();
  });

  it('renders header with passed header prop', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: null,
      },
    });

    const headerContent = <button>Test Header Button</button>;

    render(
      <Provider store={store}>
        <Template header={headerContent}>
          <div>Content</div>
        </Template>
      </Provider>
    );
    
    expect(screen.getByRole('button', { name: 'Test Header Button' })).toBeInTheDocument();
  });

  it('renders children with instructions layout by default', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: null,
      },
    });

    render(
      <Provider store={store}>
        <Template>
          <div data-testid="child-content">Test child content</div>
        </Template>
      </Provider>
    );
    
    // Should render the Grid container for instructions layout
    const grids = screen.getAllByTestId('mui-grid');
    expect(grids.length).toBeGreaterThan(0);
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders children without instructions layout when instructions=false', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: null,
      },
    });

    render(
      <Provider store={store}>
        <Template instructions={false}>
          <div data-testid="child-content">Test child content</div>
        </Template>
      </Provider>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('does not render content when status is present (loading state)', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: 'loading',
      },
    });

    render(
      <Provider store={store}>
        <Template>
          <div data-testid="should-not-render">This should not be visible</div>
        </Template>
      </Provider>
    );
    
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument();
  });

  it('does not render content when no data is present', () => {
    store = createStore(mockReducer, {
      project: {
        data: null,
        status: null,
      },
    });

    render(
      <Provider store={store}>
        <Template>
          <div data-testid="should-not-render">This should not be visible</div>
        </Template>
      </Provider>
    );
    
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument();
  });

  it('handles null header gracefully', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: null,
      },
    });

    render(
      <Provider store={store}>
        <Template header={null}>
          <div data-testid="content">Content</div>
        </Template>
      </Provider>
    );
    
    expect(screen.getByTestId('header-component')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    store = createStore(mockReducer, {
      project: {
        data: { id: 1, name: 'Test Project' },
        status: null,
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Template header={<span>Header</span>}>
          <div>Content</div>
        </Template>
      </Provider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});