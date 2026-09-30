import React from 'react';
import { render, screen } from '@testing-library/react';
import Matched from './Matched';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'interest-result' || key === 'interest-results') {
        return `${options?.count || 0} matches found`;
      }
      return key;
    },
  }),
}));

// Mock data helper
jest.mock('v2/helpers/data', () => ({
  renderHtmlInText: jest.fn((text) => text),
}));

// Mock Settings component
jest.mock('./Settings', () => {
  return function Settings({ text }) {
    return <div data-testid="settings-component">{text}</div>;
  };
});

// Mock PackCard component
jest.mock('./Card', () => {
  return function PackCard({ pack, unlocked, open }) {
    return (
      <div data-testid="pack-card">
        Package {pack.id} - unlocked: {unlocked.toString()} - open: {open.toString()}
      </div>
    );
  };
});

describe('Matched Component', () => {
  const mockProject = {
    packages: [
      {
        id: 1,
        matched: true,
        label: 'Package 1',
        service: 'Service 1',
        startOnSite: '2023-01-01',
        size: 'Large',
      },
      {
        id: 2,
        matched: true,
        label: 'Package 2',
        service: 'Service 2',
        startOnSite: '2023-02-01',
        size: 'Medium',
      },
      {
        id: 3,
        matched: false,
        label: 'Package 3',
        service: 'Service 3',
        startOnSite: '2023-03-01',
        size: 'Small',
      },
    ],
  };

  const defaultProps = {
    project: mockProject,
    subcontractor: { id: 1, name: 'Test Subcontractor' },
    unlocked: false,
    open: false,
    handleRegister: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Matched {...defaultProps} />);
    expect(screen.getByTestId('settings-component')).toBeInTheDocument();
  });

  it('returns null when no project is provided', () => {
    const { container } = render(<Matched {...defaultProps} project={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when project has no packages', () => {
    const projectWithoutPackages = { ...mockProject, packages: null };
    const { container } = render(
      <Matched {...defaultProps} project={projectWithoutPackages} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays packages label on mobile', () => {
    render(<Matched {...defaultProps} />);
    expect(screen.getByText('label-packages')).toBeInTheDocument();
  });

  it('renders Settings component with correct result text', () => {
    render(<Matched {...defaultProps} />);
    expect(screen.getByText('2 matches found')).toBeInTheDocument();
  });

  it('renders only matched packages', () => {
    render(<Matched {...defaultProps} />);
    
    // Should render 2 matched packages
    const packCards = screen.getAllByTestId('pack-card');
    expect(packCards).toHaveLength(2);
    
    // Should show Package 1 and Package 2, but not Package 3
    expect(screen.getByText(/Package 1/)).toBeInTheDocument();
    expect(screen.getByText(/Package 2/)).toBeInTheDocument();
    expect(screen.queryByText(/Package 3/)).not.toBeInTheDocument();
  });

  it('passes correct props to PackCard components', () => {
    const props = {
      ...defaultProps,
      unlocked: true,
      open: true,
    };
    
    render(<Matched {...props} />);
    
    expect(screen.getAllByText(/unlocked: true/)).toHaveLength(2);
    expect(screen.getAllByText(/open: true/)).toHaveLength(2);
  });

  it('handles empty matched packages array', () => {
    const projectWithNoMatches = {
      packages: [
        {
          id: 1,
          matched: false,
          label: 'Package 1',
        },
      ],
    };
    
    render(<Matched {...defaultProps} project={projectWithNoMatches} />);
    
    expect(screen.getByText('0 matches found')).toBeInTheDocument();
    expect(screen.queryByTestId('pack-card')).not.toBeInTheDocument();
  });

  it('handles singular vs plural results text correctly', () => {
    const projectWithOneMatch = {
      packages: [
        {
          id: 1,
          matched: true,
          label: 'Package 1',
        },
      ],
    };
    
    render(<Matched {...defaultProps} project={projectWithOneMatch} />);
    expect(screen.getByText('1 matches found')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<Matched {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});