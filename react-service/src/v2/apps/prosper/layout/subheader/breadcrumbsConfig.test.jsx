import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { MemoryRouter } from 'react-router-dom';
import breadcrumbsConfig from './breadcrumbsConfig';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key.startsWith('translated_') ? key : `translated_${key}`
  })
}));

jest.mock('v2/helpers/i18n', () => ({
  exists: jest.fn((key) => ['projects', 'home', 'Home'].includes(key))
}));

jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isTokenUser: jest.fn(() => false)
  }));
});

jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({}))
}));

// Mock react-router-dom
const mockLocation = {
  pathname: '/projects/123',
  state: null
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  MemoryRouter: ({ children }) => children,
  useLocation: () => mockLocation
}));

// Mock React hooks
const originalUseState = React.useState;
const originalUseEffect = React.useEffect;

let mockPathname = '/projects/123';
const mockSetPathname = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/projects/123';
  
  // Mock useState for pathname
  jest.spyOn(React, 'useState').mockImplementation((initial) => {
    if (initial === mockLocation.pathname) {
      return [mockPathname, mockSetPathname];
    }
    return originalUseState(initial);
  });
  
  // Mock useEffect
  jest.spyOn(React, 'useEffect').mockImplementation((fn, deps) => {
    // Only execute the effect for our specific use case
    if (deps && deps.length === 1 && typeof deps[0] === 'object' && deps[0].pathname) {
      fn();
    }
  });

  // Mock window.scrollTo
  global.window.scrollTo = jest.fn();
});

afterEach(() => {
  React.useState.mockRestore();
  React.useEffect.mockRestore();
});

describe('breadcrumbsConfig', () => {
  const defaultSubcontractor = {
    id: 1,
    subscription_id: 123
  };

  const defaultPages = {
    home: { path: 'home', keyTitle: 'Home' },
    unlockedProjects: { path: 'unlocked', keyTitle: 'Unlocked Projects' },
    registeredInterests: { path: 'interests', keyTitle: 'Registered Interests' }
  };

  beforeEach(() => {
    mockLocation.pathname = '/projects/123';
    mockLocation.state = null;
  });

  test('handles basic breadcrumb generation', () => {
    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    expect(result).toHaveLength(3); // home + projects + 123
    expect(result[0]).toEqual({ 
      path: 'home', 
      keyTitle: 'translated_Home' 
    });
    expect(result[1].path).toBe('projects');
    expect(result[1].keyTitle).toBe('Translated_projects'); // Capitalize() is applied
    expect(result[2]).toEqual({ 
      path: 'projects/123', 
      keyTitle: 'Test project' // Number should use projectName but gets capitalized
    });
  });

  test('handles company name when no project name provided', () => {
    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      null,
      defaultPages
    );

    expect(result[2].path).toBe('projects/123');
    expect(result[2].keyTitle).toBe('Test company'); // capitalize() is applied to companyName
  });

  test('handles empty parameters', () => {
    const emptyPages = {
      home: { path: 'home', keyTitle: 'Home' },
      unlockedProjects: { path: 'unlocked', keyTitle: 'Unlocked Projects' },
      registeredInterests: { path: 'interests', keyTitle: 'Registered Interests' }
    };

    const result = breadcrumbsConfig(
      {},
      '',
      '',
      emptyPages
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ 
      path: 'home', 
      keyTitle: 'translated_Home' 
    });
  });

  test('handles company-profile with state', () => {
    mockLocation.pathname = '/company-profile/456';
    
    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should generate breadcrumbs for company-profile path
    expect(result).toHaveLength(3);
    expect(result[0].path).toBe('home');
  });

  test('handles filtering for non-projects paths', () => {
    mockLocation.pathname = '/my-company/settings';

    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should generate breadcrumbs including filtered content
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles unlocked_projects query parameter', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ unlocked_projects: 'true' });

    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should handle unlocked projects case
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles unlocked_projects for token users', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ unlocked_projects: 'true' });
    
    // Mock token user
    const Subscription = require('v2/helpers/user/subscription');
    const mockSubscription = new Subscription();
    mockSubscription.isTokenUser.mockReturnValue(true);

    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should handle token user case differently
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles submit quote special case', () => {
    mockLocation.pathname = '/projects/123/submit/quote/details';

    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should handle the special submit quote case by reorganizing breadcrumbs
    expect(result).toBeDefined();
  });

  test('handles i18n non-existent keys', () => {
    const i18next = require('v2/helpers/i18n');
    i18next.exists.mockReturnValue(false);

    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should capitalize non-existent keys
    expect(result).toBeDefined();
    expect(result.some(item => item.keyTitle && item.keyTitle.length > 0)).toBe(true);
  });

  test('handles projects with non-numeric second parameter', () => {
    mockLocation.pathname = '/projects/dashboard';

    const result = breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    // Should filter out certain paths for projects/dashboard
    expect(result).toBeDefined();
  });

  test('scrolls to top on location change', () => {
    breadcrumbsConfig(
      defaultSubcontractor,
      'Test Company',
      'Test Project',
      defaultPages
    );

    expect(global.window.scrollTo).toHaveBeenCalledWith({ 
      top: 0, 
      behavior: 'smooth' 
    });
  });
});