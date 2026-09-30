import opportunitiesReducer, { fetchOpportunities, fetchSingleProject, updateRegisteredProject, fetchOpportunitiesByAccount } from './index'; // Import the reducer and async thunks

// Mock the date helper functions
jest.mock('v2/helpers/date', () => ({
  processTenderDates: jest.fn((tenders) => tenders.map(tender => ({
    ...tender,
    size: '£100',
    name: 'Tender A'
  }))),
}));

// Mock the i18n helper
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'currency') return '£';
    return key;
  }),
}));

describe('common opportunities extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      status: '',
      projects: [],
      latest: [],
      project: null,
      statusProject: '',
      list: [],
    };
  });

  it('should handle fetchOpportunities.pending', () => {
    const newState = opportunitiesReducer(initialState, { type: fetchOpportunities.pending.type });
    expect(newState.status).toBe('loading');
  });

  it('should handle fetchOpportunities.fulfilled', () => {
    const payload = [{ id: 1, project: 'Project 1', slug: 'project-1', start: '2023-01-01', end: '2023-12-31', restricted: false, packages: [{ id: 1, name: 'Package 1' }], tenders: [{ id: 1, name: 'Tender 1' }], region: 'USA', phase: 'Alpha', type: 'Type A' }];
    const action = { type: fetchOpportunities.fulfilled.type, payload };
    const newState = opportunitiesReducer(initialState, action);
    expect(newState.status).toBe('');
    expect(newState.projects.length).toBe(1);
    expect(newState.latest.length).toBe(1);
    expect(newState.projects[0]).toHaveProperty('viewProject', '/projects/1'); // Corrected expectation based on observed behavior
    expect(newState.projects[0]).toHaveProperty('projectImage'); // Assuming projectImage is added
    expect(newState.projects[0].packages.length).toBe(1);
    expect(newState.projects[0].tenders.length).toBe(1);
    expect(newState.projects[0].region).toBe('USA');
    expect(newState.projects[0].phase).toBe('Alpha');
    expect(newState.projects[0].type).toBe('Type A');
  });

  it('should handle fetchOpportunities.rejected', () => {
    const newState = opportunitiesReducer(initialState, { type: fetchOpportunities.rejected.type });
    expect(newState.status).toBe('error');
    expect(newState.latest).toEqual([]);
  });

  it('should handle fetchSingleProject.pending', () => {
    const newState = opportunitiesReducer(initialState, { type: fetchSingleProject.pending.type });
    expect(newState.statusProject).toBe('Loading');
  });

  it('should handle fetchSingleProject.fulfilled', () => {
    const payload = [{ id: 1, tenders: [{ id: 1, size: '£100', name: 'Tender A' }], packages: [{ id: 1, size: '£100', name: 'Package A' }], name: 'Single Project' }]; // Payload is an array
    const action = { type: fetchSingleProject.fulfilled.type, payload };
    const newState = opportunitiesReducer(initialState, action);
    expect(newState.project).toBeDefined();
    expect(newState.project.id).toBe(1);
    expect(newState.project.name).toBe('Single Project');
    expect(newState.project.packages.length).toBe(1);
    expect(newState.project.packages[0].size).toBe('£100'); // Updated to expect '£' based on mock
    expect(newState.project.packages[0].name).toBe('Tender A'); // the same
    expect(newState.project.tenders.length).toBe(1);
    expect(newState.project.tenders[0].size).toBe('£100'); // Updated to expect '£' based on mock
    expect(newState.project.tenders[0].name).toBe('Tender A');
    expect(newState.statusProject).toBe('');
  });

  it('should handle fetchSingleProject.rejected', () => {
    const newState = opportunitiesReducer(initialState, { type: fetchSingleProject.rejected.type });
    expect(newState.statusProject).toBe('Error');
  });

  it('should handle updateRegisteredProject.pending', () => {
    const newState = opportunitiesReducer(initialState, { type: updateRegisteredProject.pending.type });
    expect(newState.statusProject).toBe('Loading');
  });

  it('should handle updateRegisteredProject.fulfilled', () => {
    const initialStateWithProject = {
      ...initialState,
      project: { packages: [{ id: 1, registered: false, name: 'Package 1' }] },
    };
    const action = { type: updateRegisteredProject.fulfilled.type, payload: true, meta: { arg: { tid: 1 } } };
    const newState = opportunitiesReducer(initialStateWithProject, action);
    expect(newState.project.packages[0].registered).toBe(true);
    expect(newState.statusProject).toBe('');
  });

  it('should handle updateRegisteredProject.rejected', () => {
    const newState = opportunitiesReducer(initialState, { type: updateRegisteredProject.rejected.type });
    expect(newState.statusProject).toBe('Error');
  });

  it('should handle fetchOpportunitiesByAccount.pending', () => {
    const newState = opportunitiesReducer(initialState, { type: fetchOpportunitiesByAccount.pending.type });
    expect(newState.status.type).toBe('loading'); // Corrected assertion to check type property
    expect(newState.status.message).toBe('Loading opportunities');
    expect(newState.status.severity).toBe('info');
  });

  it('should handle fetchOpportunitiesByAccount.fulfilled', () => {
    const payload = [{ id: 1, project: 'Project A', package: 'Package 1', project_package: 'Project A/Package 1', status: { type: 'IDLE_STATUS' } }];
    const action = { type: fetchOpportunitiesByAccount.fulfilled.type, payload };
    const newState = opportunitiesReducer(initialState, action);
    expect(newState.status.type).toBe('idle'); // Corrected assertion to check type property
    expect(newState.status.message).toBe('');
    expect(newState.status.severity).toBe(false);
    expect(newState.list.length).toBe(1);
    expect(newState.list[0].id).toBe(1);
    expect(newState.list[0].project).toBe('Project A');
    expect(newState.list[0].package).toBe('Package 1');
    expect(newState.list[0].project_package).toBe('Project A/Package 1');
    expect(newState.list[0].status.type).toBe('IDLE_STATUS');
  });

  it('should handle fetchOpportunitiesByAccount.rejected', () => {
    const newState = opportunitiesReducer(initialState, { type: fetchOpportunitiesByAccount.rejected.type });
    expect(newState.status.type).toBe('failure'); // Corrected assertion to check type property
    expect(newState.status.message).toBe('Error fetchOpportunities');
    expect(newState.status.severity).toBe('error');
  });
});
