import getActions from './index';
import * as links from './links';

// Mock the links module
jest.mock('./links', () => ({
  planMyProjectActions: jest.fn((base) => `planMyProjectActions-${base}`),
  procurementToolsActions: jest.fn((base) => `procurementToolsActions-${base}`), 
  projectDocumentsActions: jest.fn((base) => `projectDocumentsActions-${base}`),
  projectManagement: jest.fn((base) => `projectManagement-${base}`),
}));

describe('clink actions index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return actions object with correct structure', () => {
    const mockBase = 'https://test.com/';
    const result = getActions(mockBase);

    expect(result).toEqual({
      planMyProject: 'planMyProjectActions-https://test.com/',
      procurementTools: 'procurementToolsActions-https://test.com/',
      projectDocuments: 'projectDocumentsActions-https://test.com/',
      projectManagement: 'projectManagement-https://test.com/',
    });
  });

  it('should call action functions with correct base parameter', () => {
    const mockBase = 'https://example.org/base/';
    
    getActions(mockBase);

    expect(links.planMyProjectActions).toHaveBeenCalledWith(mockBase);
    expect(links.procurementToolsActions).toHaveBeenCalledWith(mockBase);
    expect(links.projectDocumentsActions).toHaveBeenCalledWith(mockBase);
    expect(links.projectManagement).toHaveBeenCalledWith(mockBase);
  });

  it('should handle empty base parameter', () => {
    const result = getActions('');

    expect(result).toEqual({
      planMyProject: 'planMyProjectActions-',
      procurementTools: 'procurementToolsActions-',
      projectDocuments: 'projectDocumentsActions-',
      projectManagement: 'projectManagement-',
    });
  });

  it('should handle null/undefined base parameter', () => {
    const resultNull = getActions(null);
    const resultUndefined = getActions(undefined);

    expect(resultNull).toEqual({
      planMyProject: 'planMyProjectActions-null',
      procurementTools: 'procurementToolsActions-null',
      projectDocuments: 'projectDocumentsActions-null',
      projectManagement: 'projectManagement-null',
    });

    expect(resultUndefined).toEqual({
      planMyProject: 'planMyProjectActions-undefined',
      procurementTools: 'procurementToolsActions-undefined',
      projectDocuments: 'projectDocumentsActions-undefined',
      projectManagement: 'projectManagement-undefined',
    });
  });
});