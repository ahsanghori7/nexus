import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import admin, { HeaderContent } from './index';

// Mock all the dependencies
jest.mock('clink-components', () => ({
  ButtonImage: ({ src, active, handleClick, children }) => (
    <div data-testid="button-image" data-src={src} data-active={active} onClick={handleClick}>
      {children}
    </div>
  ),
  CONSTANTS: {
    s3: {
      pegasusLogo: 'test-pegasus-logo.png',
      clinkImage: 'test-clink-image.png',
      prosperImage: 'test-prosper-image.png',
      clinkLogo: 'test-clink-logo.png',
    },
  },
  Image: ({ src, height, children }) => (
    <img data-testid="image" src={src} height={height} alt="">
      {children}
    </img>
  ),
}));

jest.mock('store/reducers/actions', () => ({
  admin: 'admin-actions',
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getUrl: jest.fn((type, path) => `/${type}${path}`),
}));

jest.mock('v2/helpers/flags', () => jest.fn((flag) => flag === 'FEATURES'));

// Mock all the action imports
jest.mock('./actions/contractors', () => 'contractors-actions');
jest.mock('./actions/projects', () => 'projects-actions');
jest.mock('./actions/accounts', () => 'accounts-actions');
jest.mock('./actions/features', () => 'features-actions');

// Mock all the column imports
jest.mock('./columns/contractors', () => 'contractors-columns');
jest.mock('./columns/projects', () => 'projects-columns');
jest.mock('./columns/accounts', () => 'accounts-columns');
jest.mock('./columns/activities', () => 'activities-columns');
jest.mock('./columns/opportunities', () => 'opportunities-columns');
jest.mock('./columns/engagement_account', () => 'engagement-account-columns');
jest.mock('./columns/engagement_user', () => 'engagement-user-columns');
jest.mock('./columns/supply_chain', () => 'supply-chain-columns');
jest.mock('./columns/customer_health_score', () => 'customer-health-score-columns');
jest.mock('./columns/features', () => 'features-columns');

jest.mock('../common/actions', () => 'common-actions');

describe('Admin Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('admin configuration object', () => {
    it('should have correct pages structure', () => {
      expect(admin.pages).toBeDefined();
      expect(admin.pages.home).toEqual({
        path: 'dashboard',
        keyTitle: 'clink-home-title',
      });
      expect(admin.pages.dashboard).toEqual({
        path: 'dashboard',
        keyTitle: 'clink-dashboard-title',
      });
    });

    it('should have users page configuration', () => {
      expect(admin.pages.users).toEqual({
        actions: 'contractors-actions',
        columns: 'contractors-columns',
        actionColumn: { config: 'common-actions' },
        path: 'contractors',
        keyTitle: 'clink-contractors-title',
      });
    });

    it('should have projects page configuration', () => {
      expect(admin.pages.projects).toEqual({
        actions: 'projects-actions',
        columns: 'projects-columns',
        actionColumn: { config: 'common-actions' },
        path: 'projects',
        keyTitle: 'clink-projects-title',
      });
    });

    it('should have accounts page configuration', () => {
      expect(admin.pages.accounts).toEqual({
        actions: 'accounts-actions',
        columns: 'accounts-columns',
        actionColumn: { config: 'common-actions' },
        path: 'accounts',
        keyTitle: 'clink-accounts-title',
      });
    });

    it('should have customer health score page configuration', () => {
      expect(admin.pages.customerHealthScore).toEqual({
        columns: 'customer-health-score-columns',
        path: 'customer_health_score',
        keyTitle: 'customer-health-dashboard',
      });
    });

    it('should have search page configuration', () => {
      expect(admin.pages.search).toEqual({
        acceptedModels: ['users', 'projects', 'accounts'],
        actionColumn: { config: 'common-actions' },
        path: 'search',
        keyTitle: 'search-title',
      });
    });

    it('should have features page when FEATURES flag is enabled', () => {
      expect(admin.pages.features).toEqual({
        actions: 'features-actions',
        columns: 'features-columns',
        actionColumn: { config: 'common-actions' },
        path: 'features',
        keyTitle: 'features',
      });
    });
  });

  describe('account configuration', () => {
    it('should have account columns configured', () => {
      expect(admin.account).toEqual({
        activity: 'activities-columns',
        opportunities: 'opportunities-columns',
        engagement_account: 'engagement-account-columns',
        engagement_user: 'engagement-user-columns',
        supply_chain: 'supply-chain-columns',
      });
    });
  });

  describe('general configuration', () => {
    it('should have logo configured', () => {
      expect(admin.logo).toBeDefined();
      expect(React.isValidElement(admin.logo)).toBe(true);
    });

    it('should have config object', () => {
      expect(admin.config).toEqual({
        website: 1,
        typeAccount: 2,
      });
    });

    it('should have headerLogo configured', () => {
      expect(admin.headerLogo).toBeDefined();
      expect(React.isValidElement(admin.headerLogo)).toBe(true);
    });

    it('should have headerContent configured', () => {
      expect(admin.headerContent).toBeDefined();
      expect(React.isValidElement(admin.headerContent)).toBe(true);
    });

    it('should have actions configured', () => {
      expect(admin.actions).toBe('admin-actions');
    });
  });
});

describe('HeaderContent Component', () => {
  const mockGoTo = require('v2/helpers/url').goTo;
  const mockGetUrl = require('v2/helpers/url').getUrl;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with first button active by default', () => {
    render(<HeaderContent />);

    const buttonImages = screen.getAllByTestId('button-image');
    expect(buttonImages).toHaveLength(2);

    // First button should be active
    expect(buttonImages[0]).toHaveAttribute('data-active', 'true');
    expect(buttonImages[0]).toHaveAttribute('data-src', 'test-clink-image.png');

    // Second button should not be active
    expect(buttonImages[1]).toHaveAttribute('data-active', 'false');
    expect(buttonImages[1]).toHaveAttribute('data-src', 'test-prosper-image.png');
  });

  it('should render with second button active when first=false', () => {
    render(<HeaderContent first={false} />);

    const buttonImages = screen.getAllByTestId('button-image');

    // First button should not be active
    expect(buttonImages[0]).toHaveAttribute('data-active', 'false');

    // Second button should be active
    expect(buttonImages[1]).toHaveAttribute('data-active', 'true');
  });

  it('should handle first button click', () => {
    render(<HeaderContent />);

    const buttonImages = screen.getAllByTestId('button-image');
    buttonImages[0].click();

    expect(mockGetUrl).toHaveBeenCalledWith('admin', '/dashboard');
    expect(mockGoTo).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('should handle second button click', () => {
    render(<HeaderContent />);

    const buttonImages = screen.getAllByTestId('button-image');
    buttonImages[1].click();

    expect(mockGetUrl).toHaveBeenCalledWith('admin_prosper', '/dashboard');
    expect(mockGoTo).toHaveBeenCalledWith('/admin_prosper/dashboard');
  });
});