import React from 'react';
import adminProsper from './index';

// Mock all the dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      prosperLogoFull: 'test-prosper-logo-full.png',
    },
  },
  Image: ({ src, children }) => (
    <img data-testid="image" src={src} alt="">
      {children}
    </img>
  ),
}));

jest.mock('hooks/context/config/admin', () => ({
  HeaderContent: ({ first }) => (
    <div data-testid="header-content" data-first={first}>
      Header Content
    </div>
  ),
}));

jest.mock('./actions/accounts', () => 'accounts-actions');
jest.mock('./columns/accounts', () => 'accounts-columns');
jest.mock('./columns/supply_chain', () => 'supply-chain-columns');
jest.mock('../common/actions', () => 'common-actions');
jest.mock('./PanelHeaderContent', () => () => (
  <div data-testid="panel-header-content">Panel Header Content</div>
));

describe('AdminProsper Configuration', () => {
  describe('adminProsper configuration object', () => {
    it('should have correct pages structure', () => {
      expect(adminProsper.pages).toBeDefined();
      expect(adminProsper.pages.home).toEqual({
        path: 'dashboard',
        keyTitle: 'clink-home-title',
      });
      expect(adminProsper.pages.dashboard).toEqual({
        path: 'dashboard',
        keyTitle: 'clink-dashboard-title',
      });
    });

    it('should have accounts page configuration', () => {
      const expectedAccountsConfig = {
        actions: 'accounts-actions',
        columns: 'accounts-columns',
        actionColumn: { config: 'common-actions' },
        path: 'accounts',
        keyTitle: 'clink-accounts-title',
      };
      
      expect(adminProsper.pages.accounts).toEqual(expectedAccountsConfig);
    });

    it('should have accountsProsper page configuration', () => {
      const expectedAccountsConfig = {
        actions: 'accounts-actions',
        columns: 'accounts-columns',
        actionColumn: { config: 'common-actions' },
        path: 'accounts',
        keyTitle: 'clink-accounts-title',
      };
      
      expect(adminProsper.pages.accountsProsper).toEqual(expectedAccountsConfig);
    });

    it('should have accountsProsperSupplyChain page configuration', () => {
      expect(adminProsper.pages.accountsProsperSupplyChain).toEqual({
        actions: 'accounts-actions',
        columns: 'supply-chain-columns',
        actionColumn: { config: 'common-actions' },
        path: 'supply_chain',
        keyTitle: 'clink-supply-chain-title',
      });
    });

    it('should have prequalification page configuration', () => {
      expect(adminProsper.pages.prequalification).toBeDefined();
      expect(adminProsper.pages.prequalification.PanelHeaderContent).toBeDefined();
      expect(typeof adminProsper.pages.prequalification.PanelHeaderContent).toBe('function');
    });

    it('should have search page configuration', () => {
      expect(adminProsper.pages.search).toEqual({
        acceptedModels: ['accountsProsper', 'accountsProsperSupplyChain'],
        actionColumn: { config: 'common-actions' },
        path: 'search',
        keyTitle: 'search-title',
      });
    });
  });

  describe('general configuration', () => {
    it('should have logo configured', () => {
      expect(adminProsper.logo).toBeDefined();
      expect(React.isValidElement(adminProsper.logo)).toBe(true);
    });

    it('should have headerContent configured with first=false', () => {
      expect(adminProsper.headerContent).toBeDefined();
      expect(React.isValidElement(adminProsper.headerContent)).toBe(true);
    });

    it('should have config object', () => {
      expect(adminProsper.config).toEqual({
        website: 2,
        typeAccount: 3,
      });
    });
  });
});