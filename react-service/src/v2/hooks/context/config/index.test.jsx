// Mock all the config dependencies to avoid import errors
jest.mock('./admin', () => ({
  name: 'admin',
  pages: { dashboard: 'admin-dashboard' }
}));
jest.mock('./adminProsper', () => ({
  name: 'adminProsper',
  pages: { reports: 'admin-prosper-reports' }
}));
jest.mock('./prosper', () => ({
  name: 'prosper'
}));
jest.mock('./clink', () => ({
  name: 'clink'
}));

import config from './index';

describe('config index', () => {
  it('should export config object', () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should contain admin config', () => {
    expect(config.admin).toBeDefined();
    expect(config.admin.name).toBe('admin');
  });

  it('should contain adminProsper config', () => {
    expect(config.adminProsper).toBeDefined();
    expect(config.adminProsper.name).toBe('adminProsper');
  });

  it('should contain prosper config', () => {
    expect(config.prosper).toBeDefined();
    expect(config.prosper.name).toBe('prosper');
  });

  it('should contain clink config', () => {
    expect(config.clink).toBeDefined();
    expect(config.clink.name).toBe('clink');
  });

  it('should merge admin and adminProsper correctly', () => {
    expect(config.adminProsper.name).toBe('adminProsper');
    expect(config.adminProsper.pages).toBeDefined();
    expect(config.adminProsper.pages.dashboard).toBe('admin-dashboard');
    expect(config.adminProsper.pages.reports).toBe('admin-prosper-reports');
  });

  it('should have all required configuration types', () => {
    const expectedConfigs = ['admin', 'adminProsper', 'prosper', 'clink'];
    expectedConfigs.forEach(configType => {
      expect(config[configType]).toBeDefined();
    });
  });
});