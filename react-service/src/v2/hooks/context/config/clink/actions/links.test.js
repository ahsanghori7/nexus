import {
  planMyProjectActions,
  procurementToolsActions,
  projectDocumentsActions,
  projectManagement,
} from './links';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      "project-overview": "Project Overview",
      "project-team": "Project Team",
      "scope-and-details": "Scope & Details",
      "reference-files": "Reference Files",
      "work-packages": "Work Packages",
    };
    return translations[key] || key;
  }),
}));

describe('clink action links', () => {
  const mockBase = 'https://test.com/';

  describe('planMyProjectActions', () => {
    it('should return correct plan my project actions', () => {
      const base = 'https://test.com/project/test-slug/';
      const result = planMyProjectActions(base);
      const setupBase = '/main-contractor/projects/test-slug/setup';

      expect(result).toEqual([
        { id: 1, link: setupBase, label: 'Project Overview' },
        { id: 2, link: `${setupBase}/project_team`, label: 'Project Team' },
        { id: 3, link: `${setupBase}/scope_details`, label: 'Scope & Details' },
        { id: 4, link: `${setupBase}/reference_files`, label: 'Reference Files' },
        { id: 5, link: `${setupBase}/work_packages`, label: 'Work Packages' },
      ]);
    });

    it('should handle empty base', () => {
      const result = planMyProjectActions('');

      expect(result).toHaveLength(5);
      expect(result[0].link).toBe('/main-contractor/projects//setup');
      expect(result[1].link).toBe('/main-contractor/projects//setup/project_team');
    });
  });

  describe('procurementToolsActions', () => {
    it('should return correct procurement tools actions', () => {
      const result = procurementToolsActions(mockBase);

      expect(result).toEqual([
        { id: 1, link: `${mockBase}procurement_schedule`, label: 'Procurement schedule' },
        { id: 2, link: `${mockBase}issue_enquiry`, label: 'Enquiries issued' },
        { id: 3, link: `${mockBase}quotes_tender`, label: 'Quotes & Tender analysis' },
      ]);
    });

    it('should handle different base URLs', () => {
      const customBase = 'https://example.org/app/';
      const result = procurementToolsActions(customBase);

      expect(result[0].link).toBe(`${customBase}procurement_schedule`);
      expect(result[1].link).toBe(`${customBase}issue_enquiry`);
      expect(result[2].link).toBe(`${customBase}quotes_tender`);
    });
  });

  describe('projectDocumentsActions', () => {
    it('should return correct project documents actions', () => {
      const result = projectDocumentsActions(mockBase);

      expect(result).toEqual([
        { id: 1, link: `${mockBase}tender_templates`, label: 'Tender templates' },
        { id: 2, link: `${mockBase}orders`, label: 'Orders' },
        { id: 3, link: `${mockBase}file_manager`, label: 'File manager' },
      ]);
    });

    it('should have correct structure for each action', () => {
      const result = projectDocumentsActions(mockBase);

      result.forEach((action, index) => {
        expect(action).toHaveProperty('id', index + 1);
        expect(action).toHaveProperty('link');
        expect(action).toHaveProperty('label');
        expect(typeof action.link).toBe('string');
        expect(typeof action.label).toBe('string');
      });
    });
  });

  describe('projectManagement', () => {
    it('should return correct project management actions', () => {
      const result = projectManagement(mockBase);

      expect(result).toEqual([
        { id: 1, link: `${mockBase}instructions_variations`, label: 'Instructions Variations' },
        { id: 2, link: `${mockBase}ncr`, label: 'ncr' },
        { id: 3, link: `${mockBase}forecast_final`, label: 'forecast-final' },
        { id: 4, link: `${mockBase}form_instruction`, label: 'add-new-instructions' },
      ]);
    });

    it('should handle null base parameter', () => {
      const result = projectManagement(null);

      expect(result[0].link).toBe('nullinstructions_variations');
      expect(result[1].link).toBe('nullncr');
    });
  });

  describe('all action functions', () => {
    it('should return arrays', () => {
      expect(Array.isArray(planMyProjectActions(mockBase))).toBe(true);
      expect(Array.isArray(procurementToolsActions(mockBase))).toBe(true);
      expect(Array.isArray(projectDocumentsActions(mockBase))).toBe(true);
      expect(Array.isArray(projectManagement(mockBase))).toBe(true);
    });

    it('should have sequential IDs starting from 1', () => {
      const actions = [
        planMyProjectActions(mockBase),
        procurementToolsActions(mockBase),
        projectDocumentsActions(mockBase),
        projectManagement(mockBase),
      ];

      actions.forEach((actionList) => {
        actionList.forEach((action, index) => {
          expect(action.id).toBe(index + 1);
        });
      });
    });

    it('should contain base URL in all links', () => {
      const customBase = 'https://custom.com/base/';
      const actions = [
        procurementToolsActions(customBase),
        projectDocumentsActions(customBase),
        projectManagement(customBase),
      ];

      actions.forEach((actionList) => {
        actionList.forEach((action) => {
          expect(action.link).toContain(customBase);
        });
      });
    });

    it('planMyProjectActions links point at the project setup pages regardless of base', () => {
      const customBase = 'https://custom.com/project/custom-slug/base/';

      planMyProjectActions(customBase).forEach((action) => {
        expect(action.link).toContain('/main-contractor/projects/custom-slug/setup');
      });
    });
  });
});