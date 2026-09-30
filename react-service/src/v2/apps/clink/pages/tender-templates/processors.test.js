import {
  EXPORT_FORMATS,
  IMPORT_SOURCES,
  isValidExportFormat,
  isValidImportSource,
  templatesToCSV,
  templatesToXML,
  escapeXML,
  parseCSVToTemplates,
  parseCSVLine,
  validateImportData,
  generateTemplateStats,
  filterTemplatesByDateRange,
} from './processors';

describe('Template Processors', () => {
  describe('constants', () => {
    test('EXPORT_FORMATS contains expected values', () => {
      expect(EXPORT_FORMATS.JSON).toBe('json');
      expect(EXPORT_FORMATS.CSV).toBe('csv');
      expect(EXPORT_FORMATS.XML).toBe('xml');
      expect(EXPORT_FORMATS.PDF).toBe('pdf');
    });

    test('IMPORT_SOURCES contains expected values', () => {
      expect(IMPORT_SOURCES.FILE).toBe('file');
      expect(IMPORT_SOURCES.URL).toBe('url');
      expect(IMPORT_SOURCES.CLIPBOARD).toBe('clipboard');
      expect(IMPORT_SOURCES.DATABASE).toBe('database');
    });
  });

  describe('isValidExportFormat', () => {
    test('returns true for valid formats', () => {
      expect(isValidExportFormat('json')).toBe(true);
      expect(isValidExportFormat('csv')).toBe(true);
      expect(isValidExportFormat('xml')).toBe(true);
      expect(isValidExportFormat('pdf')).toBe(true);
    });

    test('returns false for invalid formats', () => {
      expect(isValidExportFormat('invalid')).toBe(false);
      expect(isValidExportFormat('')).toBe(false);
      expect(isValidExportFormat(null)).toBe(false);
    });
  });

  describe('isValidImportSource', () => {
    test('returns true for valid sources', () => {
      expect(isValidImportSource('file')).toBe(true);
      expect(isValidImportSource('url')).toBe(true);
      expect(isValidImportSource('clipboard')).toBe(true);
      expect(isValidImportSource('database')).toBe(true);
    });

    test('returns false for invalid sources', () => {
      expect(isValidImportSource('invalid')).toBe(false);
      expect(isValidImportSource('')).toBe(false);
      expect(isValidImportSource(null)).toBe(false);
    });
  });

  describe('templatesToCSV', () => {
    const templates = [
      {
        id: 1,
        name: 'Template 1',
        status: 'active',
        type: 'standard',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
      },
      {
        id: 2,
        name: 'Template "with quotes"',
        status: 'draft',
        type: 'custom',
        createdAt: '2023-01-03',
        updatedAt: '2023-01-04',
      },
    ];

    test('converts templates to CSV format', () => {
      const csv = templatesToCSV(templates);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('ID,Name,Status,Type,Created At,Updated At');
      expect(lines[1]).toBe('1,"Template 1",active,standard,2023-01-01,2023-01-02');
      expect(lines[2]).toBe('2,"Template ""with quotes""",draft,custom,2023-01-03,2023-01-04');
    });

    test('handles empty array', () => {
      expect(templatesToCSV([])).toBe('');
    });

    test('handles invalid input', () => {
      expect(templatesToCSV(null)).toBe('');
      expect(templatesToCSV('not array')).toBe('');
    });

    test('handles templates with missing fields', () => {
      const incompleteTemplates = [{ id: 1 }, { name: 'Test' }];
      const csv = templatesToCSV(incompleteTemplates);
      const lines = csv.split('\n');
      
      expect(lines[1]).toBe('1,"",,,,');
      expect(lines[2]).toBe(',"Test",,,,');
    });
  });

  describe('escapeXML', () => {
    test('escapes XML special characters', () => {
      expect(escapeXML('Hello & World')).toBe('Hello &amp; World');
      expect(escapeXML('<script>')).toBe('&lt;script&gt;');
      expect(escapeXML('"quoted"')).toBe('&quot;quoted&quot;');
      expect(escapeXML("'single'")).toBe('&#39;single&#39;');
    });

    test('handles non-string input', () => {
      expect(escapeXML(123)).toBe('123');
      expect(escapeXML(null)).toBe('');
      expect(escapeXML(undefined)).toBe('');
    });

    test('handles empty string', () => {
      expect(escapeXML('')).toBe('');
    });
  });

  describe('templatesToXML', () => {
    const templates = [
      {
        id: 1,
        name: 'Template & Test',
        status: 'active',
        type: 'standard',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
      },
    ];

    test('converts templates to XML format', () => {
      const xml = templatesToXML(templates);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<templates>');
      expect(xml).toContain('<template>');
      expect(xml).toContain('<id>1</id>');
      expect(xml).toContain('<name>Template &amp; Test</name>');
      expect(xml).toContain('</template>');
      expect(xml).toContain('</templates>');
    });

    test('handles empty array', () => {
      const xml = templatesToXML([]);
      expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<templates>\n</templates>');
    });

    test('handles invalid input', () => {
      const xml = templatesToXML(null);
      expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<templates></templates>');
    });

    test('handles templates with missing fields', () => {
      const incompleteTemplates = [{ id: 1 }];
      const xml = templatesToXML(incompleteTemplates);
      
      expect(xml).toContain('<id>1</id>');
      expect(xml).toContain('<name></name>');
      expect(xml).toContain('<status></status>');
    });
  });

  describe('parseCSVLine', () => {
    test('parses simple CSV line', () => {
      const result = parseCSVLine('a,b,c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('handles quoted values', () => {
      const result = parseCSVLine('a,"b,c",d');
      expect(result).toEqual(['a', 'b,c', 'd']);
    });

    test('handles escaped quotes', () => {
      const result = parseCSVLine('a,"b""c",d');
      expect(result).toEqual(['a', 'b"c', 'd']);
    });

    test('handles empty values', () => {
      const result = parseCSVLine('a,,c');
      expect(result).toEqual(['a', '', 'c']);
    });

    test('handles complex quoted strings', () => {
      const result = parseCSVLine('"Template ""Name""","Description, with comma","Type"');
      expect(result).toEqual(['Template "Name"', 'Description, with comma', 'Type']);
    });
  });

  describe('parseCSVToTemplates', () => {
    const csvData = `ID,Name,Status,Type,Created At
1,"Template 1",active,standard,2023-01-01
2,"Template 2",draft,custom,2023-01-02`;

    test('parses CSV data to templates', () => {
      const templates = parseCSVToTemplates(csvData);
      
      expect(templates).toHaveLength(2);
      expect(templates[0]).toEqual({
        id: 1,
        name: 'Template 1',
        status: 'active',
        type: 'standard',
        createdAt: '2023-01-01',
      });
    });

    test('handles invalid input', () => {
      expect(parseCSVToTemplates(null)).toEqual([]);
      expect(parseCSVToTemplates('')).toEqual([]);
      expect(parseCSVToTemplates('just headers')).toEqual([]);
    });

    test('handles CSV with quoted values', () => {
      const quotedCSV = `ID,Name
1,"Template ""Special"""`;
      
      const templates = parseCSVToTemplates(quotedCSV);
      expect(templates[0].name).toBe('Template "Special"');
    });

    test('handles different header variations', () => {
      const csvWithVariations = `ID,Name,CreateDAt,UpdatedAt
1,"Template 1",2023-01-01,2023-01-02`;
      
      const templates = parseCSVToTemplates(csvWithVariations);
      expect(templates[0].createdAt).toBe('2023-01-01');
      expect(templates[0].updatedAt).toBe('2023-01-02');
    });
  });

  describe('validateImportData', () => {
    test('validates correct template data', () => {
      const templates = [
        { id: 1, name: 'Template 1', status: 'active', type: 'standard' },
        { id: 2, name: 'Template 2', status: 'draft', type: 'custom' },
      ];
      
      const result = validateImportData(templates);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validTemplates).toHaveLength(2);
      expect(result.invalidTemplates).toHaveLength(0);
    });

    test('detects invalid template data', () => {
      const templates = [
        { id: 1, name: 'Template 1' }, // Valid
        { id: 'invalid', name: 123 }, // Invalid name type
        null, // Invalid object
      ];
      
      const result = validateImportData(templates);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validTemplates).toHaveLength(1);
      expect(result.invalidTemplates).toHaveLength(2);
    });

    test('validates status and type values', () => {
      const templates = [
        { name: 'Template 1', status: 'invalid-status', type: 'invalid-type' },
      ];
      
      const result = validateImportData(templates);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid status'))).toBe(true);
      expect(result.errors.some(e => e.includes('invalid type'))).toBe(true);
    });

    test('handles non-array input', () => {
      const result = validateImportData('not an array');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Import data must be an array');
    });
  });

  describe('generateTemplateStats', () => {
    const templates = [
      {
        id: 1,
        name: 'Template 1',
        status: 'active',
        type: 'standard',
        createdAt: '2023-01-01',
      },
      {
        id: 2,
        name: 'Template 2',
        status: 'active',
        type: 'custom',
        createdAt: '2023-01-05',
      },
      {
        id: 3,
        name: 'Template 3',
        status: 'draft',
        type: 'standard',
        createdAt: '2023-01-10',
      },
    ];

    test('generates comprehensive statistics', () => {
      const stats = generateTemplateStats(templates);
      
      expect(stats.total).toBe(3);
      expect(stats.byStatus.active).toBe(2);
      expect(stats.byStatus.draft).toBe(1);
      expect(stats.byType.standard).toBe(2);
      expect(stats.byType.custom).toBe(1);
      expect(stats.oldestTemplate).toBeDefined();
      expect(stats.newestTemplate).toBeDefined();
    });

    test('handles empty array', () => {
      const stats = generateTemplateStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.byStatus).toEqual({});
      expect(stats.byType).toEqual({});
      expect(stats.averageAge).toBe(0);
      expect(stats.oldestTemplate).toBeNull();
      expect(stats.newestTemplate).toBeNull();
    });

    test('handles invalid input', () => {
      const stats = generateTemplateStats(null);
      
      expect(stats.total).toBe(0);
      expect(stats.byStatus).toEqual({});
      expect(stats.averageAge).toBe(0);
    });

    test('handles templates without dates', () => {
      const templatesWithoutDates = [
        { id: 1, name: 'Template 1', status: 'active', type: 'standard' },
      ];
      
      const stats = generateTemplateStats(templatesWithoutDates);
      expect(stats.total).toBe(1);
      expect(stats.averageAge).toBe(0);
      expect(stats.oldestTemplate).toBeNull();
    });
  });

  describe('filterTemplatesByDateRange', () => {
    const templates = [
      { id: 1, name: 'Template 1', createdAt: '2023-01-01' },
      { id: 2, name: 'Template 2', createdAt: '2023-01-15' },
      { id: 3, name: 'Template 3', createdAt: '2023-02-01' },
      { id: 4, name: 'Template 4', createdAt: '2023-02-15' },
    ];

    test('filters by date range', () => {
      const filtered = filterTemplatesByDateRange(
        templates,
        '2023-01-10',
        '2023-02-05'
      );
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(2);
      expect(filtered[1].id).toBe(3);
    });

    test('filters with only start date', () => {
      const filtered = filterTemplatesByDateRange(templates, '2023-01-15', null);
      
      expect(filtered).toHaveLength(3); // Templates 2, 3, 4
    });

    test('filters with only end date', () => {
      const filtered = filterTemplatesByDateRange(templates, null, '2023-01-15');
      
      expect(filtered).toHaveLength(2); // Templates 1, 2
    });

    test('handles invalid date inputs', () => {
      const filtered = filterTemplatesByDateRange(templates, 'invalid-date', null);
      expect(filtered).toEqual(templates); // Returns all templates
    });

    test('handles templates without createdAt', () => {
      const templatesWithoutDates = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2', createdAt: '2023-01-01' },
      ];
      
      const filtered = filterTemplatesByDateRange(
        templatesWithoutDates,
        '2023-01-01',
        '2023-12-31'
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    test('handles invalid input', () => {
      expect(filterTemplatesByDateRange(null, '2023-01-01', '2023-12-31')).toEqual([]);
      expect(filterTemplatesByDateRange('not array', '2023-01-01', '2023-12-31')).toEqual([]);
    });
  });
});