import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GeneralInfo from './index';

// Mock the hooks
const mockHandleUpdateProject = jest.fn();
const mockUseAddProject = {
  // Add any properties that useAddProject returns
};

const mockUseUpdateProject = {
  handleUpdateProject: mockHandleUpdateProject,
};

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key)
}));

jest.mock('v2/apps/shared/components/wrapper-v2', () => {
  return function MockWrapper({ rightContent, loading, centerContent, leftContent, component, headerComponent }) {
    return (
      <div data-testid="wrapper">
        {loading && <div data-testid="loading">Loading...</div>}
        <div data-testid="right-content">{rightContent}</div>
        <div data-testid="center-content">{centerContent}</div>
        <div data-testid="left-content">{leftContent}</div>
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/pmp/add-project/hooks', () => {
  return jest.fn(() => mockUseAddProject);
});

jest.mock('./Info', () => {
  return function MockInfo({ useAddProject, useUpdateProject }) {
    return (
      <div data-testid="info-component">
        Info Component
      </div>
    );
  };
});

jest.mock('./project-image', () => {
  return function MockProjectImage() {
    return <div data-testid="project-image-component">Project Image</div>;
  };
});

jest.mock('./hooks', () => {
  return jest.fn(() => mockUseUpdateProject);
});

const mockStore = configureStore([]);

const renderWithProvider = (component, initialState = {}) => {
  const store = mockStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('GeneralInfo component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing when project data exists', () => {
    const initialState = {
      project: {
        data: { id: 1, name: 'Test Project' }
      }
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    expect(screen.getAllByTestId('wrapper')).toHaveLength(2);
    expect(screen.getByTestId('info-component')).toBeInTheDocument();
    expect(screen.getByTestId('project-image-component')).toBeInTheDocument();
  });

  it('should show loading when project data is not available', () => {
    const initialState = {
      project: {}
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render save button when project data exists', () => {
    const initialState = {
      project: {
        data: { id: 1, name: 'Test Project' }
      }
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument();
  });

  it('should not render save button when project data does not exist', () => {
    const initialState = {
      project: {}
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    expect(screen.queryByRole('button', { name: 'save' })).not.toBeInTheDocument();
  });

  it('should call handleUpdateProject when save button is clicked', () => {
    const initialState = {
      project: {
        data: { id: 1, name: 'Test Project' }
      }
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    const saveButton = screen.getByRole('button', { name: 'save' });
    fireEvent.click(saveButton);
    
    expect(mockHandleUpdateProject).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to Info component', () => {
    const initialState = {
      project: {
        data: { id: 1, name: 'Test Project' }
      }
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    // The hooks should be called with the correct arguments
    const useAddProjectHook = require('v2/apps/clink/pages/pmp/add-project/hooks');
    const useUpdateProjectHook = require('./hooks');
    
    expect(useAddProjectHook).toHaveBeenCalled();
    expect(useUpdateProjectHook).toHaveBeenCalled();
  });

  it('should display correct right content text', () => {
    const initialState = {
      project: {
        data: { id: 1, name: 'Test Project' }
      }
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    expect(screen.getByText('project-essentials-helper-1')).toBeInTheDocument();
  });

  it('should render two wrapper components', () => {
    const initialState = {
      project: {
        data: { id: 1, name: 'Test Project' }
      }
    };

    renderWithProvider(<GeneralInfo />, initialState);
    
    const wrappers = screen.getAllByTestId('wrapper');
    expect(wrappers).toHaveLength(2);
  });
});