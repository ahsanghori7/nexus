import {
  calculateTemplateMetrics,
  searchTemplates,
  groupTemplatesBy,
  validateTemplateStructure,
  mergeTemplateConfigs,
  extractTemplateMetadata,
  formatTemplateForExport,
} from './helpers';

describe('Template Helpers', () => {
  describe('calculateTemplateMetrics', () => {
    const templates = [
      { id: 1, name: 'Template 1', status: 'active' },
      { id: 2, name: 'Template 2', status: 'inactive' },
      { id: 3, name: 'Template 3', status: 'active' },
      { id: 4, name: 'Template 4', status: 'draft' },
      { id: 5, name: 'Template 5', status: 'archived' },
    ];

    test('calculates metrics correctly', () => {
      const metrics = calculateTemplateMetrics(templates);
      
      expect(metrics.total).toBe(5);
      expect(metrics.active).toBe(2);
      expect(metrics.inactive).toBe(1);
      expect(metrics.draft).toBe(1);
      expect(metrics.archived).toBe(1);
      expect(metrics.percentage.active).toBe(40);
      expect(metrics.percentage.inactive).toBe(20);
      expect(metrics.percentage.draft).toBe(20);
      expect(metrics.percentage.archived).toBe(20);
    });

    test('handles empty arrays', () => {
      const metrics = calculateTemplateMetrics([]);
      
      expect(metrics.total).toBe(0);
      expect(metrics.active).toBe(0);
      expect(metrics.percentage.active).toBe(0);
    });

    test('handles invalid input', () => {
      const metrics = calculateTemplateMetrics(null);
      
      expect(metrics.total).toBe(0);
      expect(metrics.active).toBe(0);
      expect(metrics.percentage.active).toBe(0);
    });

    test('handles templates without status', () => {
      const templatesWithoutStatus = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2', status: 'active' },
      ];
      
      const metrics = calculateTemplateMetrics(templatesWithoutStatus);
      expect(metrics.total).toBe(2);
      expect(metrics.active).toBe(1);
    });
  });

  describe('searchTemplates', () => {
    const templates = [
      { id: 1, name: 'Project Template', description: 'For projects', type: 'standard' },
      { id: 2, name: 'Invoice Template', description: 'For billing', type: 'financial' },
      { id: 3, name: 'Report Template', description: 'For reporting', tags: ['monthly', 'quarterly'] },
    ];

    test('searches by name', () => {
      const results = searchTemplates(templates, 'project');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });

    test('searches by description', () => {
      const results = searchTemplates(templates, 'billing');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });

    test('searches by type', () => {
      const results = searchTemplates(templates, 'financial');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });

    test('searches by tags', () => {
      const results = searchTemplates(templates, 'monthly');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(3);
    });

    test('is case insensitive', () => {
      const results = searchTemplates(templates, 'PROJECT');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });

    test('returns all templates for empty search', () => {
      expect(searchTemplates(templates, '')).toEqual(templates);
      expect(searchTemplates(templates, '   ')).toEqual(templates);
      expect(searchTemplates(templates, null)).toEqual(templates);
    });

    test('handles invalid inputs', () => {
      expect(searchTemplates(null, 'search')).toEqual([]);
      expect(searchTemplates(undefined, 'search')).toEqual([]);
      expect(searchTemplates('not array', 'search')).toEqual([]);
    });
  });

  describe('groupTemplatesBy', () => {
    const templates = [
      { id: 1, name: 'Template 1', status: 'active', type: 'standard' },
      { id: 2, name: 'Template 2', status: 'inactive', type: 'standard' },
      { id: 3, name: 'Template 3', status: 'active', type: 'custom' },
      { id: 4, name: 'Template 4', type: 'standard' }, // No status
    ];

    test('groups by status', () => {
      const grouped = groupTemplatesBy(templates, 'status');
      
      expect(grouped.active).toHaveLength(2);
      expect(grouped.inactive).toHaveLength(1);
      expect(grouped.Other).toHaveLength(1); // Template without status
    });

    test('groups by type', () => {
      const grouped = groupTemplatesBy(templates, 'type');
      
      expect(grouped.standard).toHaveLength(3);
      expect(grouped.custom).toHaveLength(1);
    });

    test('handles invalid inputs', () => {
      expect(groupTemplatesBy(null, 'status')).toEqual({});
      expect(groupTemplatesBy(templates, null)).toEqual({});
      expect(groupTemplatesBy(templates, '')).toEqual({});
    });

    test('handles nested properties', () => {
      const nestedTemplates = [
        { id: 1, meta: { category: 'A' } },
        { id: 2, meta: { category: 'B' } },
        { id: 3, meta: { category: 'A' } },
      ];
      
      const grouped = groupTemplatesBy(nestedTemplates, 'meta.category');
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });
  });

  describe('validateTemplateStructure', () => {
    test('validates correct template', () => {
      const template = {
        id: 1,
        name: 'Test Template',
        status: 'active',
        type: 'standard',
        createdAt: '2023-01-01',
        tags: ['test'],
      };
      
      const result = validateTemplateStructure(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects missing required fields', () => {
      const template = { status: 'active' };
      
      const result = validateTemplateStructure(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
      expect(result.errors).toContain('Missing required field: name');
    });

    test('generates warnings for missing recommended fields', () => {
      const template = { id: 1, name: 'Test' };
      
      const result = validateTemplateStructure(template);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('validates field types', () => {
      const template = {
        id: true, // Invalid type
        name: 123, // Invalid type
        createdAt: 123, // Invalid type
        tags: 'not array', // Invalid type
      };
      
      const result = validateTemplateStructure(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID must be a string or number');
      expect(result.errors).toContain('Name must be a string');
      expect(result.errors).toContain('CreatedAt must be a Date or string');
      expect(result.errors).toContain('Tags must be an array');
    });

    test('handles invalid input', () => {
      const result = validateTemplateStructure(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template must be an object');
    });
  });

  describe('mergeTemplateConfigs', () => {
    test('merges configurations correctly', () => {
      const base = { a: 1, b: { x: 10, y: 20 }, c: [1, 2] };
      const override = { b: { y: 30, z: 40 }, d: 4 };
      
      const merged = mergeTemplateConfigs(base, override);
      
      expect(merged.a).toBe(1);
      expect(merged.b).toEqual({ x: 10, y: 30, z: 40 });
      expect(merged.d).toBe(4);
    });

    test('handles array override', () => {
      const base = { arr: [1, 2, 3] };
      const override = { arr: [4, 5] };
      
      const merged = mergeTemplateConfigs(base, override);
      expect(merged.arr).toEqual([4, 5]);
    });

    test('skips null and undefined values', () => {
      const base = { a: 1, b: 2 };
      const override = { a: null, b: undefined, c: 3 };
      
      const merged = mergeTemplateConfigs(base, override);
      expect(merged.a).toBe(1); // Unchanged
      expect(merged.b).toBe(2); // Unchanged
      expect(merged.c).toBe(3); // Added
    });

    test('handles invalid inputs', () => {
      expect(mergeTemplateConfigs(null, { a: 1 })).toEqual({ a: 1 });
      expect(mergeTemplateConfigs({ a: 1 }, null)).toEqual({ a: 1 });
      expect(mergeTemplateConfigs(null, null)).toEqual({});
    });
  });

  describe('extractTemplateMetadata', () => {
    test('extracts basic metadata', () => {
      const template = {
        id: 1,
        name: 'Test Template',
        status: 'active',
        type: 'standard',
        createdAt: '2023-01-01',
        version: '1.0.0',
      };
      
      const metadata = extractTemplateMetadata(template);
      expect(metadata.id).toBe(1);
      expect(metadata.name).toBe('Test Template');
      expect(metadata.status).toBe('active');
      expect(metadata.complexity).toBe('low');
    });

    test('calculates complexity correctly', () => {
      const complexTemplate = {
        id: 1,
        name: 'Complex Template',
        sections: new Array(15).fill({}),
        fields: new Array(10).fill({}),
        rules: new Array(5).fill({}),
      };
      
      const metadata = extractTemplateMetadata(complexTemplate);
      expect(metadata.complexity).toBe('high'); // 15 + 10 + (5*2) = 35 > 20
    });

    test('calculates medium complexity', () => {
      const mediumTemplate = {
        id: 1,
        name: 'Medium Template',
        sections: new Array(8).fill({}),
        fields: new Array(5).fill({}),
      };
      
      const metadata = extractTemplateMetadata(mediumTemplate);
      expect(metadata.complexity).toBe('medium'); // 8 + 5 = 13 > 10
    });

    test('calculates size from content', () => {
      const template = {
        id: 1,
        name: 'Test',
        content: { data: 'some content here' },
      };
      
      const metadata = extractTemplateMetadata(template);
      expect(metadata.size).toBeGreaterThan(0);
    });

    test('handles invalid input', () => {
      expect(extractTemplateMetadata(null)).toBeNull();
      expect(extractTemplateMetadata('string')).toBeNull();
    });
  });

  describe('formatTemplateForExport', () => {
    const template = {
      id: 1,
      name: 'Test Template',
      status: 'active',
      type: 'standard',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-02',
    };

    test('formats as JSON', () => {
      const result = formatTemplateForExport(template, 'json');
      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(template);
    });

    test('formats as CSV', () => {
      const result = formatTemplateForExport(template, 'csv');
      expect(result).toBe('"1","Test Template","active","standard","2023-01-01"');
    });

    test('formats as summary', () => {
      const result = formatTemplateForExport(template, 'summary');
      expect(result).toEqual({
        id: 1,
        name: 'Test Template',
        status: 'active',
        type: 'standard',
        lastModified: '2023-01-02',
      });
    });

    test('handles unknown format', () => {
      const result = formatTemplateForExport(template, 'unknown');
      expect(result).toEqual(template);
    });

    test('handles invalid input', () => {
      expect(formatTemplateForExport(null)).toBeNull();
      expect(formatTemplateForExport('string')).toBeNull();
    });

    test('handles missing fields in CSV format', () => {
      const incompleteTemplate = { id: 1 };
      const result = formatTemplateForExport(incompleteTemplate, 'csv');
      expect(result).toBe('"1","","","",""');
    });

    test('uses createdAt when updatedAt is missing', () => {
      const templateWithoutUpdatedAt = {
        id: 1,
        name: 'Test',
        createdAt: '2023-01-01',
      };
      
      const result = formatTemplateForExport(templateWithoutUpdatedAt, 'summary');
      expect(result.lastModified).toBe('2023-01-01');
    });
  });
});