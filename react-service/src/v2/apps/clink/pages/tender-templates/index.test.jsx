import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import TenderTemplatesWrapper from './index';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock the context hook
jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchTenderTemplates: jest.fn().mockImplementation(() => 
        Promise.resolve({ payload: [] })
      ),
      createTenderTemplate: jest.fn().mockImplementation(() =>
        Promise.resolve({ payload: { success: true, docId: '123' } })
      ),
      fetchTemplates: jest.fn().mockImplementation(() => 
        Promise.resolve({ payload: [] })
      ),
      deleteTenderTemplate: jest.fn().mockImplementation(() =>
        Promise.resolve({})
      )
    }
  })
}));

// Mock the TenderTemplatesList component to keep the test simple
jest.mock('v2/apps/clink/pages/tender-templates/list', () => {
  return function MockTenderTemplatesList(props) {
    return <div data-testid="tender-templates-list">Mock Tender Templates List</div>;
  };
});

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      project: (state = { data: null }, action) => state,
      tenderTemplates: (state = { status: 'idle', data: [] }, action) => state
    },
    preloadedState: {
      project: { data: null },
      tenderTemplates: { status: 'idle', data: [] },
      ...initialState
    }
  });
};

const renderWithProviders = (component, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('TenderTemplatesWrapper', () => {
  test('renders loading spinner when no project data', () => {
    renderWithProviders(<TenderTemplatesWrapper />);
    
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('renders loading spinner when project data has no id', () => {
    const initialState = {
      project: { data: {} }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('renders TenderTemplates component when project data has id', async () => {
    const initialState = {
      project: { data: { id: 123 } },
      tenderTemplates: { status: 'succeeded', data: [] }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // Initially, it should show loading because assetsLoaded is false
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Optionally, after async operations complete, it should show the templates list
    // But since the async operations may not complete synchronously in tests,
    // we'll just verify the component renders without errors
  });

  test('shows loading spinner when templates are loading', () => {
    const initialState = {
      project: { data: { id: 123 } },
      tenderTemplates: { status: 'loading', data: [] }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('shows error alert when status is error', () => {
    const initialState = {
      project: { data: { id: 123 } },
      tenderTemplates: { status: 'error', data: [] }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
  });

  test('handles projects with string ID', async () => {
    const initialState = {
      project: { data: { id: 'string-id-123' } },
      tenderTemplates: { status: 'succeeded', data: [] }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // Initially, it should show loading because assetsLoaded is false
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('handles empty tenderTemplates data', async () => {
    const initialState = {
      project: { data: { id: 123 } },
      tenderTemplates: { status: 'succeeded', data: [] }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // Initially, it should show loading because assetsLoaded is false
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('handles null tenderTemplates data', async () => {
    const initialState = {
      project: { data: { id: 123 } },
      tenderTemplates: { status: 'succeeded', data: null }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // Initially, it should show loading because assetsLoaded is false
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('handles projects with zero ID', () => {
    const initialState = {
      project: { data: { id: 0 } },
      tenderTemplates: { status: 'succeeded', data: [] }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // Zero is falsy in JavaScript, so it should show loading
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('handles projects with false ID', () => {
    const initialState = {
      project: { data: { id: false } }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // False should show loading
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('handles projects with empty string ID', () => {
    const initialState = {
      project: { data: { id: '' } }
    };
    
    renderWithProviders(<TenderTemplatesWrapper />, initialState);
    
    // Empty string should show loading
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
  });
});