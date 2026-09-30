import React from 'react';
import { render } from '@testing-library/react';
import prosper from './index';

// Mock external dependencies
jest.mock('clink-components', () => ({
  Badge: ({ text, color }) => <div data-testid="badge" data-color={color}>{text}</div>,
  CONSTANTS: {
    s3: {
      prosperImage: 'https://example.com/prosper.png',
    }
  },
  Image: ({ src }) => <img src={src} alt="test" data-testid="image" />,
}));

jest.mock('store/reducers/actions', () => ({
  admin: { mockAdminAction: 'adminAction' },
  clink: { mockClinkAction: 'clinkAction' },
  prosper: { mockProsperAction: 'prosperAction' },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'approved': 'Approved',
        'clink-home-title': 'Home',
        'clink-dashboard-title': 'Dashboard',
        'clink-opportunities-title': 'Opportunities',
        'unlocked-projects': 'Unlocked Projects',
        'registered-interests': 'Registered Interests',
        'enquiries': 'Enquiries',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('./HeaderLogo', () => {
  return function MockHeaderLogo() {
    return <div data-testid="header-logo">Mock Header Logo</div>;
  };
});

jest.mock('./actions/enquiries', () => ({
  mockEnquiriesActions: 'enquiriesActions',
}));

jest.mock('./columns/enquiries', () => ({
  mockEnquiriesColumns: 'enquiriesColumns',
}));

jest.mock('./columns/actions', () => ({
  mockActionColumn: 'actionColumn',
}));

describe('prosper configuration', () => {
  it('should export a configuration object', () => {
    expect(prosper).toBeDefined();
    expect(typeof prosper).toBe('object');
  });

  it('should have pages configuration', () => {
    expect(prosper.pages).toBeDefined();
    expect(typeof prosper.pages).toBe('object');
  });

  it('should have home page configuration', () => {
    const home = prosper.pages.home;
    expect(home).toBeDefined();
    expect(home.path).toBe('dashboard');
    expect(home.keyTitle).toBe('clink-home-title');
    expect(home.home).toBe(true);
  });

  it('should have dashboard page configuration', () => {
    const dashboard = prosper.pages.dashboard;
    expect(dashboard).toBeDefined();
    expect(dashboard.path).toBe('dashboard');
    expect(dashboard.keyTitle).toBe('clink-dashboard-title');
  });

  it('should have opportunities page configuration', () => {
    const opportunities = prosper.pages.opportunities;
    expect(opportunities).toBeDefined();
    expect(opportunities.path).toBe('projects/find-opportunities');
    expect(opportunities.keyTitle).toBe('clink-opportunities-title');
  });

  it('should have unlockedProjects page configuration', () => {
    const unlockedProjects = prosper.pages.unlockedProjects;
    expect(unlockedProjects).toBeDefined();
    expect(unlockedProjects.path).toBe('projects/unlocked-projects');
    expect(unlockedProjects.keyTitle).toBe('unlocked-projects');
  });

  it('should have registeredInterests page configuration', () => {
    const registeredInterests = prosper.pages.registeredInterests;
    expect(registeredInterests).toBeDefined();
    expect(registeredInterests.path).toBe('projects/registered-interests');
    expect(registeredInterests.keyTitle).toBe('registered-interests');
  });

  it('should have enquiries page configuration', () => {
    const enquiries = prosper.pages.enquiries;
    expect(enquiries).toBeDefined();
    expect(enquiries.actions).toBeDefined();
    expect(enquiries.columns).toBeDefined();
    expect(enquiries.actionColumn).toBeDefined();
    expect(enquiries.path).toBe('enquiries');
    expect(enquiries.keyTitle).toBe('enquiries');
  });

  it('should have prequalification page configuration', () => {
    const prequalification = prosper.pages.prequalification;
    expect(prequalification).toBeDefined();
    expect(prequalification.PanelHeaderContent).toBeDefined();
    expect(typeof prequalification.PanelHeaderContent).toBe('function');
  });

  it('should have logo configuration', () => {
    expect(prosper.logo).toBeDefined();
    expect(React.isValidElement(prosper.logo)).toBe(true);
  });

  it('should have config object', () => {
    expect(prosper.config).toBeDefined();
    expect(prosper.config.website).toBe(2);
    expect(prosper.config.typeAccount).toBe(3);
  });

  it('should have HeaderLogo component', () => {
    expect(prosper.HeaderLogo).toBeDefined();
    expect(typeof prosper.HeaderLogo).toBe('function');
  });

  it('should have actions configuration', () => {
    expect(prosper.actions).toBeDefined();
    expect(prosper.actions.mockProsperAction).toBe('prosperAction');
  });

  it('should have filterRoutes configuration', () => {
    expect(prosper.filterRoutes).toBeDefined();
    expect(Array.isArray(prosper.filterRoutes)).toBe(true);
    expect(prosper.filterRoutes).toEqual([16]);
  });

  it('should have all required pages', () => {
    const expectedPages = [
      'home',
      'dashboard',
      'opportunities',
      'unlockedProjects',
      'registeredInterests',
      'enquiries',
      'prequalification',
    ];
    
    expectedPages.forEach(page => {
      expect(prosper.pages[page]).toBeDefined();
    });
  });

  describe('PanelHeaderContent component', () => {
    it('should render approved status correctly', () => {
      const approved = { status: true };
      const PanelHeaderContent = prosper.pages.prequalification.PanelHeaderContent;
      
      const { getByTestId } = render(<PanelHeaderContent approved={approved} />);
      
      const badge = getByTestId('badge');
      expect(badge).toHaveTextContent('Approved');
      expect(badge).toHaveAttribute('data-color', 'green');
    });

    it('should render not approved status correctly', () => {
      const approved = { status: false, message: 'Missing documents' };
      const PanelHeaderContent = prosper.pages.prequalification.PanelHeaderContent;
      
      const { getByTestId, getByText } = render(<PanelHeaderContent approved={approved} />);
      
      const badge = getByTestId('badge');
      expect(badge).toHaveTextContent('Not approved');
      expect(badge).toHaveAttribute('data-color', 'red');
      expect(getByText('Missing documents')).toBeInTheDocument();
    });

    it('should render without approved prop', () => {
      const PanelHeaderContent = prosper.pages.prequalification.PanelHeaderContent;
      
      const { getByTestId } = render(<PanelHeaderContent />);
      
      const badge = getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });
  });
});