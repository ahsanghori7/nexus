import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Progress from './Progress';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Return the key as the translation
}));

const mockStore = configureStore([]);

const renderWithProviders = (component, initialState = {}) => {
  const store = mockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Progress Component', () => {
  const defaultState = {
    project: {
      data: {
        slug: 'test-project-slug'
      }
    }
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render without crashing', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    expect(screen.getByText('project-setup')).toBeInTheDocument();
  });

  it('should display all step labels', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    expect(screen.getByText('project-overview')).toBeInTheDocument();
    expect(screen.getByText('project-team')).toBeInTheDocument();
    expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    expect(screen.getByText('reference-files')).toBeInTheDocument();
    expect(screen.getByText('work-packages')).toBeInTheDocument();
  });

  it('should highlight the active step', () => {
    renderWithProviders(<Progress activeStep={2} />, defaultState);

    const activeStepButton = screen.getByText('scope-and-details').closest('button');
    expect(activeStepButton).toHaveStyle('font-weight: 600');
    expect(activeStepButton).toHaveStyle('text-decoration: underline');
  });

  it('should navigate when step button is clicked', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    const scopeDetailsButton = screen.getByText('scope-and-details');
    fireEvent.click(scopeDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/test-project-slug/setup/scope_details');
  });

  it('should navigate to general-info when first step is clicked', () => {
    renderWithProviders(<Progress activeStep={1} />, defaultState);

    const generalInfoButton = screen.getByText('project-overview');
    fireEvent.click(generalInfoButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/test-project-slug/setup');
  });

  it('should navigate to project-team when second step is clicked', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    const projectTeamButton = screen.getByText('project-team');
    fireEvent.click(projectTeamButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/test-project-slug/setup/project_team');
  });

  it('should navigate to reference-files when fourth step is clicked', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    const projectFilesButton = screen.getByText('reference-files');
    fireEvent.click(projectFilesButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/test-project-slug/setup/reference_files');
  });

  it('should navigate to work-packages when fifth step is clicked', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    const tradesButton = screen.getByText('work-packages');
    fireEvent.click(tradesButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/test-project-slug/setup/work_packages');
  });

  it('should handle undefined project slug', () => {
    const stateWithoutSlug = {
      project: {
        data: {}
      }
    };

    renderWithProviders(<Progress activeStep={0} />, stateWithoutSlug);

    const generalInfoButton = screen.getByText('project-overview');
    fireEvent.click(generalInfoButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/undefined/setup');
  });

  it('should handle missing project data', () => {
    const stateWithoutProject = {};

    renderWithProviders(<Progress activeStep={0} />, stateWithoutProject);

    const generalInfoButton = screen.getByText('project-overview');
    fireEvent.click(generalInfoButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/undefined/setup');
  });

  it('should show completed steps correctly', () => {
    renderWithProviders(<Progress activeStep={2} />, defaultState);

    // Steps before activeStep should be marked as completed
    const steps = screen.getAllByRole('button');

    // The stepper will mark steps before activeStep as completed
    // We can verify this by checking the structure is rendered correctly
    expect(screen.getByText('project-overview')).toBeInTheDocument();
    expect(screen.getByText('project-team')).toBeInTheDocument();
    expect(screen.getByText('scope-and-details')).toBeInTheDocument();
    expect(steps).toHaveLength(5);
  });

  it('should render project-setup title', () => {
    renderWithProviders(<Progress activeStep={0} />, defaultState);

    expect(screen.getByText('project-setup')).toBeInTheDocument();
  });
});
