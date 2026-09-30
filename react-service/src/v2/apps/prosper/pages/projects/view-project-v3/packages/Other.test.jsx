import React from 'react';
import { render, screen } from '@testing-library/react';
import Other from './Other';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock PackCard component
jest.mock('./Card', () => {
  return function PackCard({ pack, unlocked, hideRegister, showStatus }) {
    return (
      <div data-testid="pack-card">
        Package {pack.id} - unlocked: {unlocked.toString()} - hideRegister: {hideRegister.toString()} - showStatus: {showStatus.toString()}
      </div>
    );
  };
});

// Mock Settings component
jest.mock('./Settings', () => {
  return function Settings({ text }) {
    return <div data-testid="settings-component">{text}</div>;
  };
});

describe('Other Component', () => {
  const mockProject = {
    packages: [
      {
        id: 1,
        matched: true,
        label: 'Package 1',
        service: 'Service 1',
      },
      {
        id: 2,
        matched: false,
        label: 'Package 2',
        service: 'Service 2',
      },
      {
        id: 3,
        matched: false,
        label: 'Package 3',
        service: 'Service 3',
      },
    ],
  };

  const defaultProps = {
    project: mockProject,
    subcontractor: { id: 1, name: 'Test Subcontractor' },
    unlocked: false,
    handleRegister: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Other {...defaultProps} />);
    expect(screen.getByTestId('settings-component')).toBeInTheDocument();
  });

  it('returns null when no project is provided', () => {
    const { container } = render(<Other {...defaultProps} project={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when project has no packages', () => {
    const projectWithoutPackages = { ...mockProject, packages: null };
    const { container } = render(
      <Other {...defaultProps} project={projectWithoutPackages} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays other packages label on mobile', () => {
    render(<Other {...defaultProps} />);
    expect(screen.getByText('label-other-packages')).toBeInTheDocument();
  });

  it('renders Settings component with correct text', () => {
    render(<Other {...defaultProps} />);
    expect(screen.getByText('other-interest-result')).toBeInTheDocument();
  });

  it('renders only non-matched packages', () => {
    render(<Other {...defaultProps} />);
    
    // Should render 2 non-matched packages (Package 2 and Package 3)
    const packCards = screen.getAllByTestId('pack-card');
    expect(packCards).toHaveLength(2);
    
    // Should show Package 2 and Package 3, but not Package 1 (matched)
    expect(screen.getByText(/Package 2/)).toBeInTheDocument();
    expect(screen.getByText(/Package 3/)).toBeInTheDocument();
    expect(screen.queryByText(/Package 1/)).not.toBeInTheDocument();
  });

  it('passes correct props to PackCard components', () => {
    const props = {
      ...defaultProps,
      unlocked: true,
    };
    
    render(<Other {...props} />);
    
    // Should pass hideRegister: true and showStatus: true to all cards
    expect(screen.getAllByText(/hideRegister: true/)).toHaveLength(2);
    expect(screen.getAllByText(/showStatus: true/)).toHaveLength(2);
    expect(screen.getAllByText(/unlocked: true/)).toHaveLength(2);
  });

  it('always passes hideRegister and showStatus props to PackCard', () => {
    render(<Other {...defaultProps} />);
    
    expect(screen.getAllByText(/hideRegister: true/)).toHaveLength(2);
    expect(screen.getAllByText(/showStatus: true/)).toHaveLength(2);
  });

  it('handles project with only matched packages', () => {
    const projectWithOnlyMatched = {
      packages: [
        {
          id: 1,
          matched: true,
          label: 'Package 1',
        },
        {
          id: 2,
          matched: true,
          label: 'Package 2',
        },
      ],
    };
    
    render(<Other {...defaultProps} project={projectWithOnlyMatched} />);
    
    // Should not render any PackCard components
    expect(screen.queryByTestId('pack-card')).not.toBeInTheDocument();
    
    // Should still render the Settings component
    expect(screen.getByTestId('settings-component')).toBeInTheDocument();
  });

  it('handles empty packages array', () => {
    const projectWithNoPackages = {
      packages: [],
    };
    
    render(<Other {...defaultProps} project={projectWithNoPackages} />);
    
    expect(screen.queryByTestId('pack-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('settings-component')).toBeInTheDocument();
  });

  it('filters matched packages correctly using map and conditional return', () => {
    render(<Other {...defaultProps} />);
    
    // Verify that only non-matched packages are rendered
    const packCards = screen.getAllByTestId('pack-card');
    expect(packCards).toHaveLength(2);
    
    // Verify the content shows the correct package IDs
    expect(screen.getByText(/Package 2/)).toBeInTheDocument();
    expect(screen.getByText(/Package 3/)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<Other {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});