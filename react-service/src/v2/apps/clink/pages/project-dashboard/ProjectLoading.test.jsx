import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProjectLoading from './ProjectLoading';

const mockNavigate = jest.fn();

// Mock i18next
jest.mock('i18next', () => ({
  t: (key) => key,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => (
    <div data-testid="mock-browser-router">{children}</div>
  ),
  useNavigate: () => mockNavigate,
}));

jest.mock('v2/apps/shared/components/empty-state', () => {
  return function MockEmptyState({
    variant,
    title,
    description,
    primaryAction,
  }) {
    return (
      <section data-testid="empty-state" data-variant={variant}>
        <h2>{title}</h2>
        <p>{description}</p>
        {primaryAction && (
          <button type="button" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
        )}
      </section>
    );
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProjectLoading', () => {
  const defaultProps = {
    loading: false,
    isThereTasks: false,
    slug: 'test-project',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the shared first-use empty state when loading is false and there are no tasks', () => {
    renderWithRouter(<ProjectLoading {...defaultProps} />);

    expect(screen.getByTestId('empty-state')).toHaveAttribute(
      'data-variant',
      'firstUse',
    );
    expect(
      screen.getByText('project-dashboard-no-packages-title'),
    ).toBeInTheDocument();
    expect(screen.getByText('no-trades')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'project-dashboard-add-trades-work-packages',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render when loading is true', () => {
    const props = { ...defaultProps, loading: true };
    const { container } = renderWithRouter(<ProjectLoading {...props} />);

    // Should have BrowserRouter but no ProjectLoading content
    expect(
      container.querySelector('[data-testid="mock-browser-router"]'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render when there are tasks', () => {
    const props = { ...defaultProps, isThereTasks: true };
    const { container } = renderWithRouter(<ProjectLoading {...props} />);

    // Should have BrowserRouter but no ProjectLoading content
    expect(
      container.querySelector('[data-testid="mock-browser-router"]'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('navigates to trades work packages page from the primary CTA', () => {
    renderWithRouter(<ProjectLoading {...defaultProps} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'project-dashboard-add-trades-work-packages',
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      `/main-contractor/projects/${defaultProps.slug}/setup/work_packages`,
    );
  });
});
