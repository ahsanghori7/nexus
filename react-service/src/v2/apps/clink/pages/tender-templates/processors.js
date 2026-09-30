// Additional template utility functions for data processing

/**
 * Template export formats
 */
// Import required functions from other modules
import { isValidStatus, isValidType, getTemplateAge } from './constants';

export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  XML: 'xml',
  PDF: 'pdf',
};

/**
 * Template import sources
 */
export const IMPORT_SOURCES = {
  FILE: 'file',
  URL: 'url',
  CLIPBOARD: 'clipboard',
  DATABASE: 'database',
};

/**
 * Validates export format
 * @param {string} format - Export format to validate
 * @returns {boolean} - Whether format is supported
 */
export const isValidExportFormat = (format) => {
  return Object.values(EXPORT_FORMATS).includes(format);
};

/**
 * Validates import source
 * @param {string} source - Import source to validate
 * @returns {boolean} - Whether source is supported
 */
export const isValidImportSource = (source) => {
  return Object.values(IMPORT_SOURCES).includes(source);
};

/**
 * Converts template data to CSV format
 * @param {Array} templates - Array of template objects
 * @returns {string} - CSV formatted string
 */
export const templatesToCSV = (templates) => {
  if (!Array.isArray(templates) || templates.length === 0) {
    return '';
  }

  const headers = ['ID', 'Name', 'Status', 'Type', 'Created At', 'Updated At'];
  const csvRows = [headers.join(',')];

  templates.forEach(template => {
    if (template) {
      const row = [
        template.id || '',
        `"${(template.name || '').replace(/"/g, '""')}"`,
        template.status || '',
        template.type || '',
        template.createdAt || '',
        template.updatedAt || '',
      ];
      csvRows.push(row.join(','));
    }
  });

  return csvRows.join('\n');
};

/**
 * Escapes XML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeXML = (str) => {
  if (typeof str !== 'string') {
    return String(str || '');
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Converts template data to XML format
 * @param {Array} templates - Array of template objects
 * @returns {string} - XML formatted string
 */
export const templatesToXML = (templates) => {
  if (!Array.isArray(templates)) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<templates></templates>';
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<templates>\n';

  templates.forEach(template => {
    if (template) {
      xml += '  <template>\n';
      xml += `    <id>${escapeXML(template.id || '')}</id>\n`;
      xml += `    <name>${escapeXML(template.name || '')}</name>\n`;
      xml += `    <status>${escapeXML(template.status || '')}</status>\n`;
      xml += `    <type>${escapeXML(template.type || '')}</type>\n`;
      xml += `    <createdAt>${escapeXML(template.createdAt || '')}</createdAt>\n`;
      xml += `    <updatedAt>${escapeXML(template.updatedAt || '')}</updatedAt>\n`;
      xml += '  </template>\n';
    }
  });

  xml += '</templates>';
  return xml;
};

/**
 * Parses a single CSV line handling quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array} - Array of values
 */
export const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  values.push(current);
  return values;
};

/**
 * Parses CSV data into template objects
 * @param {string} csvData - CSV formatted string
 * @returns {Array} - Array of template objects
 */
export const parseCSVToTemplates = (csvData) => {
  if (!csvData || typeof csvData !== 'string') {
    return [];
  }

  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const templates = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const template = {};

    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        let value = values[index].trim();

        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }

        // Map common header variations
        switch (header) {
          case 'id':
            template.id = isNaN(value) ? value : parseInt(value, 10);
            break;
          case 'name':
            template.name = value;
            break;
          case 'status':
            template.status = value;
            break;
          case 'type':
            template.type = value;
            break;
          case 'created at':
          case 'createdat':
            template.createdAt = value;
            break;
          case 'updated at':
          case 'updatedat':
            template.updatedAt = value;
            break;
          default:
            template[header] = value;
        }
      }
    });

    if (Object.keys(template).length > 0) {
      templates.push(template);
    }
  }

  return templates;
};

/**
 * Validates template import data

/**
 * Validates template import data
 * @param {Array} templates - Array of template objects
 * @returns {object} - Validation result
 */
export const validateImportData = (templates) => {
  if (!Array.isArray(templates)) {
    return {
      isValid: false,
      errors: ['Import data must be an array'],
      validTemplates: [],
      invalidTemplates: [],
    };
  }

  const result = {
    isValid: true,
    errors: [],
    validTemplates: [],
    invalidTemplates: [],
  };

  templates.forEach((template, index) => {
    const templateErrors = [];

    if (!template || typeof template !== 'object') {
      templateErrors.push(`Template at index ${index} is not an object`);
    } else {
      if (!template.name || typeof template.name !== 'string') {
        templateErrors.push(`Template at index ${index} is missing or has invalid name`);
      }

      if (template.id !== undefined &&
          typeof template.id !== 'string' &&
          typeof template.id !== 'number') {
        templateErrors.push(`Template at index ${index} has invalid ID type`);
      }

      if (template.status && !isValidStatus(template.status)) {
        templateErrors.push(`Template at index ${index} has invalid status`);
      }

      if (template.type && !isValidType(template.type)) {
        templateErrors.push(`Template at index ${index} has invalid type`);
      }
    }

    if (templateErrors.length > 0) {
      result.invalidTemplates.push({
        index,
        template,
        errors: templateErrors,
      });
      result.errors.push(...templateErrors);
    } else {
      result.validTemplates.push(template);
    }
  });

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Generates template statistics
 * @param {Array} templates - Array of template objects
 * @returns {object} - Template statistics
 */
export const generateTemplateStats = (templates) => {
  if (!Array.isArray(templates)) {
    return {
      total: 0,
      byStatus: {},
      byType: {},
      averageAge: 0,
      oldestTemplate: null,
      newestTemplate: null,
    };
  }

  const stats = {
    total: templates.length,
    byStatus: {},
    byType: {},
    averageAge: 0,
    oldestTemplate: null,
    newestTemplate: null,
  };

  let totalAge = 0;
  let validAgeCount = 0;

  templates.forEach(template => {
    if (!template) return;

    // Count by status
    if (template.status) {
      stats.byStatus[template.status] = (stats.byStatus[template.status] || 0) + 1;
    }

    // Count by type
    if (template.type) {
      stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
    }

    // Calculate age statistics
    if (template.createdAt) {
      const age = getTemplateAge(template.createdAt);
      if (age >= 0) {
        totalAge += age;
        validAgeCount++;

        if (!stats.oldestTemplate || age > getTemplateAge(stats.oldestTemplate.createdAt)) {
          stats.oldestTemplate = template;
        }

        if (!stats.newestTemplate || age < getTemplateAge(stats.newestTemplate.createdAt)) {
          stats.newestTemplate = template;
        }
      }
    }
  });

  // Calculate average age
  if (validAgeCount > 0) {
    stats.averageAge = Math.round(totalAge / validAgeCount);
  }

  return stats;
};

/**
 * Filters templates by date range
 * @param {Array} templates - Array of template objects
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Array} - Filtered templates
 */
export const filterTemplatesByDateRange = (templates, startDate, endDate) => {
  if (!Array.isArray(templates)) {
    return [];
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && isNaN(start.getTime())) {
    return templates;
  }

  if (end && isNaN(end.getTime())) {
    return templates;
  }

  return templates.filter(template => {
    if (!template || !template.createdAt) {
      return false;
    }

    const created = new Date(template.createdAt);
    if (isNaN(created.getTime())) {
      return false;
    }

    if (start && created < start) {
      return false;
    }

    if (end && created > end) {
      return false;
    }

    return true;
  });
};
