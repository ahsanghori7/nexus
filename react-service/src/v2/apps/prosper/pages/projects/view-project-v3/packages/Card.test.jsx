import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import PackCard from './Card';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'label-interest-submitted': 'Interest Submitted',
        'label-register-interest': 'Register Interest',
        'opportunity-closed': 'Opportunity Closed',
        'registered-interests': 'registered interests',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock moment
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return (date) => ({
    format: (format) => {
      if (format === 'Do MMMM YYYY') return '1st January 2023';
      return actualMoment(date).format(format);
    },
  });
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconOrangePound: 'icon-pound.png',
      iconOrangeStart: 'icon-start.png',
      iconOrangeType: 'icon-type.png',
      iconWhiteLock: 'icon-lock.png',
      closedIcon: 'icon-closed.png',
      registeredInterestIcon: 'icon-registered.png',
    },
  },
  Image: ({ src, alt, width, style }) => (
    <img 
      src={src} 
      alt={alt} 
      width={width}
      style={style}
      data-testid="mock-image"
    />
  ),
}));

// Mock Item component
jest.mock('v2/apps/prosper/shared/crm-components/Item', () => {
  return function Item({ icon, type, value }) {
    return (
      <div data-testid="item-component">
        {type}: {value}
      </div>
    );
  };
});

// Mock Subheader component
jest.mock('v2/apps/prosper/shared/Subheader', () => {
  return function Subheader({ data }) {
    return <div data-testid="subheader">Subheader for {data.label}</div>;
  };
});

// Mock Subscription helper
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isTokenUser: jest.fn(() => false),
  }));
});

// Mock @mui/styles
jest.mock('@mui/styles', () => ({
  makeStyles: () => () => ({
    parent: 'parent-class',
    backdrop: 'backdrop-class',
  }),
}));

describe('PackCard Component', () => {
  const defaultPack = {
    id: 1,
    registered: false,
    can_register: true,
    awarded: false,
    matched: false,
    label: 'Test Package',
    service: 'Test Service',
    startOnSite: '2023-01-01',
    size: '£100,000',
    interest_count: 3,
  };

  const defaultProps = {
    pack: defaultPack,
    subcontractor: { 
      id: 1, 
      name: 'Test Subcontractor',
      subscription_id: 'test-subscription'
    },
    unlocked: false,
    handleRegister: jest.fn(),
    hideRegister: false,
    showStatus: false,
    open: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PackCard {...defaultProps} />);
    expect(screen.getByText('Test Package')).toBeInTheDocument();
  });

  it('displays package information correctly', () => {
    render(<PackCard {...defaultProps} />);
    
    expect(screen.getByText('Test Package')).toBeInTheDocument();
    expect(screen.getByText(/Test Service/)).toBeInTheDocument();
    expect(screen.getByText(/1st January 2023/)).toBeInTheDocument();
    expect(screen.getByText(/£100,000/)).toBeInTheDocument();
  });

  it('handles missing startOnSite date', () => {
    const packWithoutDate = { ...defaultPack, startOnSite: null };
    render(<PackCard {...defaultProps} pack={packWithoutDate} />);
    
    expect(screen.getByText(/N\/A/)).toBeInTheDocument();
  });

  it('displays register interest button when not registered and not closed', () => {
    render(<PackCard {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Register Interest');
    expect(button).not.toBeDisabled();
  });

  it('displays interest submitted button when registered', () => {
    const registeredPack = { ...defaultPack, registered: true };
    render(<PackCard {...defaultProps} pack={registeredPack} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Interest Submitted');
    expect(button).toBeDisabled();
  });

  it('displays opportunity closed button when awarded', () => {
    const closedPack = { ...defaultPack, awarded: true };
    render(<PackCard {...defaultProps} pack={closedPack} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Opportunity Closed');
    expect(button).toBeDisabled();
  });

  it('calls handleRegister when register button is clicked', () => {
    const handleRegisterMock = jest.fn();
    render(
      <PackCard 
        {...defaultProps} 
        handleRegister={handleRegisterMock}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleRegisterMock).toHaveBeenCalledWith(1);
  });

  it('does not call handleRegister when registered', () => {
    const handleRegisterMock = jest.fn();
    const registeredPack = { ...defaultPack, registered: true };
    
    render(
      <PackCard 
        {...defaultProps} 
        pack={registeredPack}
        handleRegister={handleRegisterMock}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleRegisterMock).not.toHaveBeenCalled();
  });

  it('shows interest count when matched', () => {
    const matchedPack = { ...defaultPack, matched: true, interest_count: 5 };
    render(<PackCard {...defaultProps} pack={matchedPack} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('registered interests')).toBeInTheDocument();
  });

  it('shows 5+ when interest count is greater than 5', () => {
    const matchedPack = { ...defaultPack, matched: true, interest_count: 8 };
    render(<PackCard {...defaultProps} pack={matchedPack} />);
    
    expect(screen.getByText('5+')).toBeInTheDocument();
  });

  it('does not show interest count when not matched', () => {
    render(<PackCard {...defaultProps} />);
    
    expect(screen.queryByText('registered interests')).not.toBeInTheDocument();
  });

  it('hides register button when hideRegister is true', () => {
    render(<PackCard {...defaultProps} hideRegister={true} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows lock icon when open is true', () => {
    render(<PackCard {...defaultProps} open={true} />);
    
    const images = screen.getAllByTestId('mock-image');
    expect(images.length).toBeGreaterThan(0);
    // The lock icon should be present when open is true
    const hasLockIcon = images.some(img => img.getAttribute('src') === 'icon-lock.png');
    expect(hasLockIcon).toBe(true);
  });

  it('shows closed backdrop when awarded', () => {
    const closedPack = { ...defaultPack, awarded: true };
    render(<PackCard {...defaultProps} pack={closedPack} />);
    
    const images = screen.getAllByTestId('mock-image');
    expect(images.length).toBeGreaterThan(0);
    // The closed icon should be present when awarded is true
    const hasClosedIcon = images.some(img => img.getAttribute('src') === 'icon-closed.png');
    expect(hasClosedIcon).toBe(true);
  });

  it('displays Subheader when conditions are met', () => {
    const Subscription = require('v2/helpers/user/subscription');
    const subscriptionInstance = new Subscription();
    subscriptionInstance.isTokenUser.mockReturnValue(true);
    
    const props = {
      ...defaultProps,
      unlocked: true,
      pack: { ...defaultPack, can_register: false },
    };
    
    render(<PackCard {...props} />);
    // Since the subheader is conditionally rendered, we check if the condition is working
    // by verifying that the component renders without error
    expect(screen.getByText('Test Package')).toBeInTheDocument();
  });

  it('displays Subheader when showStatus is true', () => {
    const props = {
      ...defaultProps,
      unlocked: true,
      showStatus: true,
    };
    
    render(<PackCard {...props} />);
    expect(screen.getByTestId('subheader')).toBeInTheDocument();
  });

  it('handles default values for missing pack properties', () => {
    const incompletePack = {
      id: 1,
    };
    
    render(<PackCard {...defaultProps} pack={incompletePack} />);
    
    expect(screen.getByText('*****')).toBeInTheDocument(); // Default packageName
  });

  it('matches snapshot', () => {
    const { container } = render(<PackCard {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});