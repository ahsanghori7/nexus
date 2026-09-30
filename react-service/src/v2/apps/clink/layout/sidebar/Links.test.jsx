import React from 'react';
import { main, secondary, companyAssets } from './Links';

jest.mock('clink-components', () => ({
  CONSTANTS: {
    userTypes: {
      userTypeAdministrator: 'administrator',
      userTypeTeamAdmin: 'team_admin',
      userTypeTeamManager: 'team_manager',
      userTypeSuperAdmin: 'super_admin',
    },
  },
}));

describe('Links', () => {
  describe('main links', () => {
    it('exports main links array', () => {
      expect(Array.isArray(main)).toBe(true);
      expect(main).toHaveLength(4);
    });

    it('has correct structure for all main links', () => {
      main.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('icon');
        expect(link).toHaveProperty('url');
        expect(typeof link.label).toBe('string');
        expect(typeof link.url).toBe('string');
        expect(React.isValidElement(link.icon)).toBe(true);
      });
    });

    it('contains expected main navigation items', () => {
      const expectedLabels = [
        'Projects',
        'Admin & Settings',
        'Supply Chain',
        'Cost Planning Tool',
      ];

      expectedLabels.forEach((label) => {
        const linkExists = main.some((link) => link.label === label);
        expect(linkExists).toBe(true);
      });
    });

    it('has correct URLs for main links', () => {
      const projectsLink = main.find((link) => link.label === 'Projects');
      expect(projectsLink.url).toBe('/main-contractor');

      const teamManagerLink = main.find(
        (link) => link.label === 'Admin & Settings',
      );
      expect(teamManagerLink.url).toBe('/admin/settings');

      const supplyChainLink = main.find(
        (link) => link.label === 'Supply Chain',
      );
      expect(supplyChainLink.url).toBe('/main-contractor/supply_chain');

      const costPlanningLink = main.find(
        (link) => link.label === 'Cost Planning Tool',
      );
      expect(costPlanningLink.url).toBe('/main-contractor/cost-planning-tool');
    });

    it('has _self target for Admin & Settings and Cost Planning Tool only', () => {
      const linksWithTarget = ['Admin & Settings', 'Cost Planning Tool'];

      main.forEach((link) => {
        if (linksWithTarget.includes(link.label)) {
          expect(link.target).toBe('_self');
        } else {
          expect(link.target).toBeUndefined();
        }
      });
    });

    it('renders icons correctly', () => {
      main.forEach((link) => {
        expect(React.isValidElement(link.icon)).toBe(true);
      });
    });
  });

  describe('company assets links', () => {
    it('exports companyAssets array', () => {
      expect(Array.isArray(companyAssets)).toBe(true);
      expect(companyAssets).toHaveLength(1);
    });

    it('has correct structure for company assets links', () => {
      companyAssets.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('icon');
        expect(link).toHaveProperty('url');
        expect(typeof link.label).toBe('string');
        expect(typeof link.url).toBe('string');
        expect(React.isValidElement(link.icon)).toBe(true);
      });
    });

    it('contains Company Assets link with correct URL', () => {
      const companyAssetsLink = companyAssets.find(
        (link) => link.label === 'Company Assets',
      );
      expect(companyAssetsLink).toBeDefined();
      expect(companyAssetsLink.url).toBe('/main-contractor/company-assets');
    });
  });

  describe('secondary links', () => {
    it('exports secondary links array', () => {
      expect(Array.isArray(secondary)).toBe(true);
      expect(secondary).toHaveLength(1);
    });

    it('has correct structure for secondary links', () => {
      secondary.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('icon');
        expect(link).toHaveProperty('url');
        expect(link).toHaveProperty('target');
        expect(typeof link.label).toBe('string');
        expect(typeof link.url).toBe('string');
        expect(typeof link.target).toBe('string');
        expect(React.isValidElement(link.icon)).toBe(true);
      });
    });

    it('contains Help & Support link', () => {
      const helpLink = secondary.find(
        (link) => link.label === 'Help & Support',
      );
      expect(helpLink).toBeDefined();
      expect(helpLink.url).toBe('https://knowledge.c-link.com/en/guides');
      expect(helpLink.target).toBe('_blank');
    });

    it('renders secondary icons correctly', () => {
      secondary.forEach((link) => {
        expect(React.isValidElement(link.icon)).toBe(true);
      });
    });
  });

  describe('overall structure', () => {
    it('exports main, secondary and companyAssets arrays', () => {
      const allExports = require('./Links');
      const exportKeys = Object.keys(allExports);

      expect(exportKeys).toContain('main');
      expect(exportKeys).toContain('secondary');
      expect(exportKeys).toContain('companyAssets');
      expect(exportKeys).toHaveLength(3);
    });

    it('has no duplicate labels across all link groups', () => {
      const allLabels = [...main, ...secondary, ...companyAssets].map(
        (link) => link.label,
      );
      const uniqueLabels = new Set(allLabels);

      expect(allLabels.length).toBe(uniqueLabels.size);
    });

    it('all links have unique URLs', () => {
      const allUrls = [...main, ...secondary, ...companyAssets].map(
        (link) => link.url,
      );
      const uniqueUrls = new Set(allUrls);

      expect(allUrls.length).toBe(uniqueUrls.size);
    });
  });
});
