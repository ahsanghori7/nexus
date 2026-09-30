import clink from './index';

// Mock external dependencies
jest.mock('store/reducers/actions', () => ({
  admin: { mockAdminAction: 'adminAction' },
  clink: { mockClinkAction: 'clinkAction' },
  prosper: { mockProsperAction: 'prosperAction' },
}));

jest.mock('./actions', () => ({
  mockGetActions: 'getActionsFunction',
}));

jest.mock('./table', () => ({
  mockTable: 'tableConfig',
}));

jest.mock('./instructionsVariationsTable', () => ({
  mockInstructionsVariationsTable: 'instructionsVariationsTableConfig',
}));

jest.mock('./forecastTable', () => ({
  mockForecastTable: 'forecastTableConfig',
}));

// Mock BASE_URLS global
global.BASE_URLS = {
  CLINK: '/main-contractor',
};

describe('clink configuration', () => {
  it('should export a configuration object', () => {
    expect(clink).toBeDefined();
    expect(typeof clink).toBe('object');
  });

  it('should have the correct base URL', () => {
    expect(clink.base).toBe('/main-contractor/project');
  });

  it('should have pages configuration', () => {
    expect(clink.pages).toBeDefined();
    expect(typeof clink.pages).toBe('object');
  });

  it('should have addTeam page configuration', () => {
    expect(clink.pages.addTeam).toBeDefined();
    expect(clink.pages.addTeam.path).toBe('add_team');
    expect(clink.pages.addTeam.table).toBeDefined();
  });

  it('should have projectDashboard page configuration', () => {
    const projectDashboard = clink.pages.projectDashboard;
    expect(projectDashboard).toBeDefined();
    expect(projectDashboard.base).toBe('/main-contractor/project');
    expect(projectDashboard.actions).toBeDefined();
    expect(projectDashboard.path).toBe('project_dashboard/:slug');
    expect(projectDashboard.keyTitle).toBe('clink-enquiries-title');
  });

  it('should have instructionsVariations page configuration', () => {
    expect(clink.pages.instructionsVariations).toBeDefined();
    expect(clink.pages.instructionsVariations.table).toBeDefined();
  });

  it('should have ncr page configuration', () => {
    expect(clink.pages.ncr).toBeDefined();
    expect(clink.pages.ncr.table).toBeDefined();
  });

  it('should have forecastFinal page configuration', () => {
    expect(clink.pages.forecastFinal).toBeDefined();
    expect(clink.pages.forecastFinal.table).toBeDefined();
  });

  it('should have addNewInstruction page configuration', () => {
    expect(clink.pages.addNewInstruction).toBeDefined();
    expect(typeof clink.pages.addNewInstruction).toBe('object');
  });

  it('should have actions configuration', () => {
    expect(clink.actions).toBeDefined();
    expect(clink.actions.mockClinkAction).toBe('clinkAction');
  });

  it('should have all required pages', () => {
    const expectedPages = [
      'addTeam',
      'projectDashboard',
      'instructionsVariations',
      'ncr',
      'forecastFinal',
      'addNewInstruction',
    ];
    
    expectedPages.forEach(page => {
      expect(clink.pages[page]).toBeDefined();
    });
  });

  it('should use imported dependencies correctly', () => {
    // Test that imports are used correctly
    expect(clink.pages.addTeam.table).toBeDefined();
    expect(clink.pages.projectDashboard.actions).toBeDefined();
    expect(clink.pages.instructionsVariations.table).toBeDefined();
    expect(clink.pages.ncr.table).toBeDefined();
    expect(clink.pages.forecastFinal.table).toBeDefined();
    expect(clink.actions).toBeDefined();
  });
});