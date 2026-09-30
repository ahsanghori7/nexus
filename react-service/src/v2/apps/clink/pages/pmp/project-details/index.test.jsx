import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockFetchConstants = jest.fn();
const mockUseUpdateProject = jest.fn(() => ({
  siteDetailsRef: { current: null },
  clientDetailsRef: { current: null },
  insuranceRequirementsRef: { current: null },
  handleUpdateProject: jest.fn(),
}));
let mockButtonProps = [];

jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchConstants: mockFetchConstants,
    },
  }),
}));

jest.mock('@mui/material/Button', () => {
  const React = require('react');
  return (props) => {
    mockButtonProps.push(props);
    return React.createElement('button', { type: 'button', ...props });
  };
});

jest.mock('v2/apps/shared/components/wrapper-v2', () => {
  const React = require('react');
  return ({ leftContent, rightContent }) =>
    React.createElement(
      'div',
      { 'data-testid': 'wrapper' },
      typeof leftContent === 'function' ? leftContent() : leftContent,
      typeof rightContent === 'function' ? rightContent() : rightContent,
    );
});

jest.mock('v2/apps/clink/pages/pmp/project-details/site-constraints', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'site-details-component' }),
    Search: () => React.createElement('div', { 'data-testid': 'search-component' }),
    OpeningHours: () => React.createElement('div', { 'data-testid': 'opening-hours-component' }),
    SiteConstraints: () => React.createElement('div', { 'data-testid': 'site-constraints-component' }),
  };
});

jest.mock('v2/apps/clink/pages/pmp/project-details/client-information', () => () => (
  <div data-testid="client-information-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/InsuranceRequirements', () => () => (
  <div data-testid="insurance-requirements-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/Others', () => () => (
  <div data-testid="others-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/main-contract-structure', () => () => (
  <div data-testid="main-contract-structure-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/key-dates-periods', () => () => (
  <div data-testid="key-dates-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/legal-dispute-terms', () => () => (
  <div data-testid="legal-dispute-terms-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/payment-terms', () => () => (
  <div data-testid="payment-terms-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/design-warranties', () => () => (
  <div data-testid="design-warranties-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/commercial-terms', () => () => (
  <div data-testid="commercial-terms-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/notices-addresses', () => () => (
  <div data-testid="notices-addresses-component" />
));

jest.mock('v2/apps/clink/pages/pmp/project-details/member-selection', () => () => (
  <div data-testid="member-selection-component" />
));

jest.mock('./hooks', () => ({
  __esModule: true,
  default: mockUseUpdateProject,
}));

const ProjectDetails = require('v2/apps/clink/pages/pmp/project-details').default;

describe('ProjectDetails page', () => {
beforeEach(() => {
  mockNavigate.mockClear();
  mockFetchConstants.mockClear();
  mockUseUpdateProject.mockReset();
  mockUseUpdateProject.mockImplementation(() => ({
    siteDetailsRef: { current: null },
    clientDetailsRef: { current: null },
    insuranceRequirementsRef: { current: null },
    handleUpdateProject: jest.fn(),
  }));
  mockButtonProps = [];
});

  const baseProps = () => ({
    project: { data: { slug: 'project-slug' } },
    constants: { project: {} },
    clinkAccount: { country: { code: 'UK' } },
    dispatch: jest.fn(),
  });

  it('renders sections and triggers navigation on go back', () => {
    const props = baseProps();

    render(<ProjectDetails {...props} />);

    expect(screen.getByTestId('search-component')).toBeInTheDocument();
    expect(screen.getByTestId('opening-hours-component')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'go-back' }));
    expect(mockNavigate).toHaveBeenCalledWith('/main-contractor/projects/project-slug/setup/project_team');
  });

  it('calls fetch constants when project types are missing and saves via update handler', () => {
    const props = baseProps();
    const { dispatch } = props;
    const handleUpdateProject = jest.fn();
    const mockHookValue = {
      siteDetailsRef: { current: null },
      clientDetailsRef: { current: null },
      insuranceRequirementsRef: { current: null },
      handleUpdateProject,
    };

    mockUseUpdateProject.mockImplementation(() => mockHookValue);

    render(<ProjectDetails {...props} />);

    expect(mockFetchConstants).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(mockUseUpdateProject).toHaveBeenCalled();

    const saveButtonProps = mockButtonProps.find((props) => props.children === 'save');
    expect(saveButtonProps).toBeDefined();
    saveButtonProps.onClick();
    const hookInstance = mockUseUpdateProject.mock.results.at(-1)?.value;
    expect(hookInstance).toBe(mockHookValue);
    expect(handleUpdateProject).toHaveBeenCalled();
  });

  it('skips rendering project driven sections when project data is unavailable', () => {
    const props = baseProps();
    props.project = {};

    render(<ProjectDetails {...props} />);

    expect(screen.queryByTestId('client-information-component')).not.toBeInTheDocument();
    expect(mockButtonProps.find((props) => props.children === 'save')).toBeUndefined();
  });
});
