import React from 'react';
import { render } from '@testing-library/react';
import config from './index';

// Mock the imported components
jest.mock('v2/apps/prosper/pages', () => {
  return function MockProsper({ children, title, type }) {
    return (
      <div data-testid="prosper-page" data-title={title} data-type={type}>
        {children}
      </div>
    );
  };
});

jest.mock('v2/apps/prosper/pages/company-profile', () => {
  return function MockCompanyProfile() {
    return <div data-testid="company-profile">Company Profile Component</div>;
  };
});

describe('CRM router config', () => {
  describe('config structure', () => {
    it('should have required top-level properties', () => {
      expect(config).toHaveProperty('id');
      expect(config).toHaveProperty('path');
      expect(config).toHaveProperty('routes');
      expect(config).toHaveProperty('redirects');
    });

    it('should have correct id and path', () => {
      expect(config.id).toBe(20);
      expect(config.path).toBe('company_profile');
    });

    it('should have routes array with correct length', () => {
      expect(Array.isArray(config.routes)).toBe(true);
      expect(config.routes).toHaveLength(2);
    });

    it('should have redirects array', () => {
      expect(Array.isArray(config.redirects)).toBe(true);
      expect(config.redirects).toHaveLength(1);
    });
  });

  describe('routes configuration', () => {
    it('should have first route with companyId parameter', () => {
      const firstRoute = config.routes[0];
      expect(firstRoute.id).toBe(21);
      expect(firstRoute.path).toBe(':companyId');
      expect(firstRoute).toHaveProperty('element');
      expect(firstRoute).toHaveProperty('filter');
      expect(firstRoute).toHaveProperty('filterCountry');
    });

    it('should have second route with companyId and contactId parameters', () => {
      const secondRoute = config.routes[1];
      expect(secondRoute.id).toBe(22);
      expect(secondRoute.path).toBe(':companyId/:contactId');
      expect(secondRoute).toHaveProperty('element');
      expect(secondRoute).toHaveProperty('filter');
      expect(secondRoute).toHaveProperty('filterCountry');
    });

    it('should have filter arrays for both routes', () => {
      config.routes.forEach((route, index) => {
        expect(Array.isArray(route.filter)).toBe(true);
        expect(route.filter).toHaveLength(0);
        expect(Array.isArray(route.filterCountry)).toBe(true);
        expect(route.filterCountry).toHaveLength(0);
      });
    });
  });

  describe('redirects configuration', () => {
    it('should have correct redirect configuration', () => {
      const redirect = config.redirects[0];
      expect(redirect.path).toBe('/company_profile');
      expect(redirect.to).toBe('/projects/enquiries');
    });
  });

  describe('companyProfileConfig', () => {
    let companyProfileConfig;
    
    beforeEach(() => {
      // Extract the shared config from the first route
      const firstRoute = config.routes[0];
      companyProfileConfig = {
        element: firstRoute.element,
        filter: firstRoute.filter,
        filterCountry: firstRoute.filterCountry
      };
    });

    it('should have React element as component', () => {
      expect(React.isValidElement(companyProfileConfig.element)).toBe(true);
    });

    it('should render Prosper component with correct props', () => {
      const { getByTestId } = render(companyProfileConfig.element);
      const prosperPage = getByTestId('prosper-page');
      
      expect(prosperPage).toBeInTheDocument();
      expect(prosperPage).toHaveAttribute('data-title', 'OpportunitiesHeader');
      expect(prosperPage).toHaveAttribute('data-type', 'component');
    });

    it('should render CompanyProfile component inside Prosper', () => {
      const { getByTestId } = render(companyProfileConfig.element);
      const companyProfile = getByTestId('company-profile');
      
      expect(companyProfile).toBeInTheDocument();
      expect(companyProfile).toHaveTextContent('Company Profile Component');
    });

    it('should have empty filter arrays', () => {
      expect(companyProfileConfig.filter).toEqual([]);
      expect(companyProfileConfig.filterCountry).toEqual([]);
    });
  });

  describe('element rendering', () => {
    it('should render first route element correctly', () => {
      const { getByTestId } = render(config.routes[0].element);
      
      expect(getByTestId('prosper-page')).toBeInTheDocument();
      expect(getByTestId('company-profile')).toBeInTheDocument();
    });

    it('should render second route element correctly', () => {
      const { getByTestId } = render(config.routes[1].element);
      
      expect(getByTestId('prosper-page')).toBeInTheDocument();
      expect(getByTestId('company-profile')).toBeInTheDocument();
    });

    it('should have identical elements for both routes', () => {
      const firstElement = config.routes[0].element;
      const secondElement = config.routes[1].element;
      
      // Both should render the same component structure
      const { container: container1 } = render(firstElement);
      const { container: container2 } = render(secondElement);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe('configuration validation', () => {
    it('should have unique route ids', () => {
      const routeIds = config.routes.map(route => route.id);
      const uniqueIds = [...new Set(routeIds)];
      expect(routeIds.length).toBe(uniqueIds.length);
    });

    it('should have valid route paths', () => {
      config.routes.forEach(route => {
        expect(typeof route.path).toBe('string');
        expect(route.path.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent configuration structure', () => {
      const expectedKeys = ['id', 'path', 'element', 'filter', 'filterCountry'];
      
      config.routes.forEach(route => {
        expectedKeys.forEach(key => {
          expect(route).toHaveProperty(key);
        });
      });
    });
  });

  describe('type validation', () => {
    it('should have correct property types', () => {
      expect(typeof config.id).toBe('number');
      expect(typeof config.path).toBe('string');
      expect(Array.isArray(config.routes)).toBe(true);
      expect(Array.isArray(config.redirects)).toBe(true);
    });

    it('should have correct route property types', () => {
      config.routes.forEach(route => {
        expect(typeof route.id).toBe('number');
        expect(typeof route.path).toBe('string');
        expect(React.isValidElement(route.element)).toBe(true);
        expect(Array.isArray(route.filter)).toBe(true);
        expect(Array.isArray(route.filterCountry)).toBe(true);
      });
    });
  });

  describe('export validation', () => {
    it('should export config as default', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
      expect(config).not.toBeNull();
    });

    it('should be a complete router configuration', () => {
      const requiredConfigKeys = ['id', 'path', 'routes', 'redirects'];
      requiredConfigKeys.forEach(key => {
        expect(config).toHaveProperty(key);
      });
    });
  });
});