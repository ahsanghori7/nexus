import {
  validateTemplateName,
  formatTemplateStatus,
  isValidTemplateId,
  generateTemplateKey,
  parseTemplateConfig,
  filterTemplatesByStatus,
  sortTemplatesByName,
} from './utils';

describe('Template Utilities', () => {
  describe('validateTemplateName', () => {
    test('returns true for valid template names', () => {
      expect(validateTemplateName('Valid Template')).toBe(true);
      expect(validateTemplateName('Template123')).toBe(true);
      expect(validateTemplateName('A')).toBe(true);
      expect(validateTemplateName('Template with spaces')).toBe(true);
    });

    test('returns false for invalid template names', () => {
      expect(validateTemplateName('')).toBe(false);
      expect(validateTemplateName('   ')).toBe(false);
      expect(validateTemplateName(null)).toBe(false);
      expect(validateTemplateName(undefined)).toBe(false);
      expect(validateTemplateName(123)).toBe(false);
      expect(validateTemplateName('Template<script>')).toBe(false);
      expect(validateTemplateName('Template/with/slashes')).toBe(false);
      expect(validateTemplateName('Template:with:colons')).toBe(false);
      expect(validateTemplateName('Template|with|pipes')).toBe(false);
      expect(validateTemplateName('Template*with*asterisks')).toBe(false);
      expect(validateTemplateName('a'.repeat(101))).toBe(false); // Too long
    });

    test('handles edge cases', () => {
      expect(validateTemplateName('Template"with"quotes')).toBe(false);
      expect(validateTemplateName('Template\\with\\backslashes')).toBe(false);
      expect(validateTemplateName('Template?with?questions')).toBe(false);
    });
  });

  describe('formatTemplateStatus', () => {
    test('formats known statuses correctly', () => {
      expect(formatTemplateStatus('active')).toBe('Active');
      expect(formatTemplateStatus('ACTIVE')).toBe('Active');
      expect(formatTemplateStatus('inactive')).toBe('Inactive');
      expect(formatTemplateStatus('draft')).toBe('Draft');
      expect(formatTemplateStatus('archived')).toBe('Archived');
    });

    test('capitalizes unknown statuses', () => {
      expect(formatTemplateStatus('pending')).toBe('Pending');
      expect(formatTemplateStatus('custom')).toBe('Custom');
      expect(formatTemplateStatus('test')).toBe('Test');
    });

    test('handles invalid inputs', () => {
      expect(formatTemplateStatus('')).toBe('Unknown');
      expect(formatTemplateStatus(null)).toBe('Unknown');
      expect(formatTemplateStatus(undefined)).toBe('Unknown');
      expect(formatTemplateStatus(123)).toBe('Unknown');
      expect(formatTemplateStatus({})).toBe('Unknown');
    });
  });

  describe('isValidTemplateId', () => {
    test('returns true for valid IDs', () => {
      expect(isValidTemplateId(1)).toBe(true);
      expect(isValidTemplateId(123)).toBe(true);
      expect(isValidTemplateId('abc123')).toBe(true);
      expect(isValidTemplateId('template-id')).toBe(true);
      expect(isValidTemplateId('a')).toBe(true);
    });

    test('returns false for invalid IDs', () => {
      expect(isValidTemplateId(null)).toBe(false);
      expect(isValidTemplateId(undefined)).toBe(false);
      expect(isValidTemplateId('')).toBe(false);
      expect(isValidTemplateId('   ')).toBe(false);
      expect(isValidTemplateId(0)).toBe(false);
      expect(isValidTemplateId(-1)).toBe(false);
      expect(isValidTemplateId(1.5)).toBe(false);
      expect(isValidTemplateId({})).toBe(false);
      expect(isValidTemplateId([])).toBe(false);
    });
  });

  describe('generateTemplateKey', () => {
    test('generates keys correctly', () => {
      expect(generateTemplateKey('proj1', 'tender1', 'template1')).toBe('proj1-tender1-template1');
      expect(generateTemplateKey('a', 'b', 'c')).toBe('a-b-c');
    });

    test('handles missing parts', () => {
      expect(generateTemplateKey('proj1', '', 'template1')).toBe('proj1-template1');
      expect(generateTemplateKey('', 'tender1', 'template1')).toBe('tender1-template1');
      expect(generateTemplateKey('proj1', 'tender1', '')).toBe('proj1-tender1');
      expect(generateTemplateKey('', '', '')).toBe('unknown');
    });

    test('handles null and undefined', () => {
      expect(generateTemplateKey(null, 'tender1', 'template1')).toBe('tender1-template1');
      expect(generateTemplateKey('proj1', undefined, 'template1')).toBe('proj1-template1');
      expect(generateTemplateKey(null, null, null)).toBe('unknown');
    });
  });

  describe('parseTemplateConfig', () => {
    test('parses valid configurations', () => {
      const config = {
        name: 'Test Template',
        type: 'custom',
        version: '2.0.0',
        settings: { theme: 'dark' }
      };
      
      const result = parseTemplateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        name: 'Test Template',
        type: 'custom',
        version: '2.0.0',
        settings: { theme: 'dark' }
      });
    });

    test('provides defaults for missing properties', () => {
      const result = parseTemplateConfig({ name: 'Test' });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        name: 'Test',
        type: 'default',
        version: '1.0.0',
        settings: {}
      });
    });

    test('handles empty configuration', () => {
      const result = parseTemplateConfig({});
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        name: '',
        type: 'default',
        version: '1.0.0',
        settings: {}
      });
    });

    test('handles invalid inputs', () => {
      expect(parseTemplateConfig(null)).toEqual({ isValid: false, data: null });
      expect(parseTemplateConfig(undefined)).toEqual({ isValid: false, data: null });
      expect(parseTemplateConfig('string')).toEqual({ isValid: false, data: null });
      expect(parseTemplateConfig(123)).toEqual({ isValid: false, data: null });
    });
  });

  describe('filterTemplatesByStatus', () => {
    const templates = [
      { id: 1, name: 'Template 1', status: 'active' },
      { id: 2, name: 'Template 2', status: 'inactive' },
      { id: 3, name: 'Template 3', status: 'Active' },
      { id: 4, name: 'Template 4', status: 'draft' },
    ];

    test('filters by status correctly', () => {
      const activeTemplates = filterTemplatesByStatus(templates, 'active');
      expect(activeTemplates).toHaveLength(2);
      expect(activeTemplates[0].id).toBe(1);
      expect(activeTemplates[1].id).toBe(3);
    });

    test('is case insensitive', () => {
      const activeTemplates = filterTemplatesByStatus(templates, 'ACTIVE');
      expect(activeTemplates).toHaveLength(2);
    });

    test('returns all templates when no status provided', () => {
      expect(filterTemplatesByStatus(templates, '')).toEqual(templates);
      expect(filterTemplatesByStatus(templates, null)).toEqual(templates);
      expect(filterTemplatesByStatus(templates, undefined)).toEqual(templates);
    });

    test('handles invalid inputs', () => {
      expect(filterTemplatesByStatus(null, 'active')).toEqual([]);
      expect(filterTemplatesByStatus(undefined, 'active')).toEqual([]);
      expect(filterTemplatesByStatus('not array', 'active')).toEqual([]);
    });

    test('handles templates without status', () => {
      const templatesWithoutStatus = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2', status: null },
        { id: 3, name: 'Template 3', status: 'active' },
      ];
      
      const result = filterTemplatesByStatus(templatesWithoutStatus, 'active');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });
  });

  describe('sortTemplatesByName', () => {
    const templates = [
      { id: 1, name: 'Charlie Template' },
      { id: 2, name: 'Alpha Template' },
      { id: 3, name: 'Beta Template' },
      { id: 4, name: 'delta template' },
    ];

    test('sorts ascending by default', () => {
      const sorted = sortTemplatesByName(templates);
      const names = sorted.map(t => t.name);
      expect(names).toEqual(['Alpha Template', 'Beta Template', 'Charlie Template', 'delta template']);
    });

    test('sorts ascending explicitly', () => {
      const sorted = sortTemplatesByName(templates, 'asc');
      const names = sorted.map(t => t.name);
      expect(names).toEqual(['Alpha Template', 'Beta Template', 'Charlie Template', 'delta template']);
    });

    test('sorts descending', () => {
      const sorted = sortTemplatesByName(templates, 'desc');
      const names = sorted.map(t => t.name);
      expect(names).toEqual(['delta template', 'Charlie Template', 'Beta Template', 'Alpha Template']);
    });

    test('handles templates without names', () => {
      const templatesWithoutNames = [
        { id: 1, name: 'Charlie' },
        { id: 2 },
        { id: 3, name: 'Alpha' },
        { id: 4, name: null },
      ];
      
      const sorted = sortTemplatesByName(templatesWithoutNames);
      expect(sorted).toHaveLength(4);
      // Templates without names should be sorted to the beginning (empty string comparison)
    });

    test('does not mutate original array', () => {
      const original = [...templates];
      sortTemplatesByName(templates);
      expect(templates).toEqual(original);
    });

    test('handles invalid inputs', () => {
      expect(sortTemplatesByName(null)).toEqual([]);
      expect(sortTemplatesByName(undefined)).toEqual([]);
      expect(sortTemplatesByName('not array')).toEqual([]);
    });

    test('handles empty array', () => {
      expect(sortTemplatesByName([])).toEqual([]);
    });
  });
});