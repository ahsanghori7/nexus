// Additional utility functions for tender templates
// Focused on template data manipulation and validation

/**
 * Calculates template metrics
 * @param {Array} templates - Array of template objects
 * @returns {object} - Template metrics
 */
export const calculateTemplateMetrics = (templates) => {
  if (!Array.isArray(templates)) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      draft: 0,
      archived: 0,
      percentage: {
        active: 0,
        inactive: 0,
        draft: 0,
        archived: 0,
      }
    };
  }

  const metrics = {
    total: templates.length,
    active: 0,
    inactive: 0,
    draft: 0,
    archived: 0,
  };

  templates.forEach(template => {
    if (template && template.status) {
      const status = template.status.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(metrics, status)) {
        metrics[status]++;
      }
    }
  });

  // Calculate percentages
  const total = metrics.total || 1; // Avoid division by zero
  metrics.percentage = {
    active: Math.round((metrics.active / total) * 100),
    inactive: Math.round((metrics.inactive / total) * 100),
    draft: Math.round((metrics.draft / total) * 100),
    archived: Math.round((metrics.archived / total) * 100),
  };

  return metrics;
};

/**
 * Finds templates by search term
 * @param {Array} templates - Array of template objects
 * @param {string} searchTerm - Term to search for
 * @returns {Array} - Matching templates
 */
export const searchTemplates = (templates, searchTerm) => {
  if (!Array.isArray(templates)) {
    return [];
  }

  if (!searchTerm || typeof searchTerm !== 'string') {
    return templates;
  }

  const term = searchTerm.toLowerCase().trim();
  if (term === '') {
    return templates;
  }

  return templates.filter(template => {
    if (!template) return false;

    const searchableFields = [
      template.name,
      template.description,
      template.type,
      template.status,
      template.tags?.join(' '),
    ].filter(Boolean);

    return searchableFields.some(field =>
      field.toString().toLowerCase().includes(term)
    );
  });
};

/**
 * Groups templates by a specified field
 * @param {Array} templates - Array of template objects
 * @param {string} groupBy - Field to group by
 * @returns {object} - Grouped templates
 */
export const groupTemplatesBy = (templates, groupBy) => {
  if (!Array.isArray(templates) || !groupBy) {
    return {};
  }

  return templates.reduce((groups, template) => {
    if (!template) return groups;

    let key = template[groupBy];

    // Handle nested properties
    if (groupBy.includes('.')) {
      const keys = groupBy.split('.');
      key = keys.reduce((obj, k) => obj?.[k], template);
    }

    // Use 'Other' for undefined/null values
    key = key || 'Other';

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(template);
    return groups;
  }, {});
};

/**
 * Validates template data structure
 * @param {object} template - Template object to validate
 * @returns {object} - Validation result
 */
export const validateTemplateStructure = (template) => {
  const errors = [];
  const warnings = [];

  if (!template || typeof template !== 'object') {
    errors.push('Template must be an object');
    return { isValid: false, errors, warnings };
  }

  // Required fields
  const requiredFields = ['id', 'name'];
  requiredFields.forEach(field => {
    if (!template[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Optional but recommended fields
  const recommendedFields = ['status', 'type', 'createdAt'];
  recommendedFields.forEach(field => {
    if (!template[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  });

  // Validate specific field types
  if (template.id && typeof template.id !== 'string' && typeof template.id !== 'number') {
    errors.push('ID must be a string or number');
  }

  if (template.name && typeof template.name !== 'string') {
    errors.push('Name must be a string');
  }

  if (template.createdAt && !(template.createdAt instanceof Date) && typeof template.createdAt !== 'string') {
    errors.push('CreatedAt must be a Date or string');
  }

  if (template.tags && !Array.isArray(template.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Merges template configurations
 * @param {object} baseConfig - Base configuration
 * @param {object} overrideConfig - Override configuration
 * @returns {object} - Merged configuration
 */
export const mergeTemplateConfigs = (baseConfig, overrideConfig) => {
  if (!baseConfig || typeof baseConfig !== 'object') {
    return overrideConfig || {};
  }

  if (!overrideConfig || typeof overrideConfig !== 'object') {
    return baseConfig;
  }

  const merged = { ...baseConfig };

  Object.keys(overrideConfig).forEach(key => {
    const baseValue = merged[key];
    const overrideValue = overrideConfig[key];

    if (overrideValue === null || overrideValue === undefined) {
      // Skip null/undefined values
      return;
    }

    if (Array.isArray(overrideValue)) {
      merged[key] = [...overrideValue];
    } else if (typeof overrideValue === 'object' && typeof baseValue === 'object') {
      merged[key] = mergeTemplateConfigs(baseValue, overrideValue);
    } else {
      merged[key] = overrideValue;
    }
  });

  return merged;
};

/**
 * Extracts template metadata
 * @param {object} template - Template object
 * @returns {object} - Extracted metadata
 */
export const extractTemplateMetadata = (template) => {
  if (!template || typeof template !== 'object') {
    return null;
  }

  const metadata = {
    id: template.id,
    name: template.name,
    status: template.status,
    type: template.type,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    version: template.version,
    size: 0,
    complexity: 'low',
  };

  // Calculate template size (rough estimate)
  if (template.content) {
    metadata.size = JSON.stringify(template.content).length;
  }

  // Determine complexity based on various factors
  let complexityScore = 0;

  if (template.sections && Array.isArray(template.sections)) {
    complexityScore += template.sections.length;
  }

  if (template.fields && Array.isArray(template.fields)) {
    complexityScore += template.fields.length;
  }

  if (template.rules && Array.isArray(template.rules)) {
    complexityScore += template.rules.length * 2; // Rules add more complexity
  }

  if (complexityScore > 20) {
    metadata.complexity = 'high';
  } else if (complexityScore > 10) {
    metadata.complexity = 'medium';
  }

  return metadata;
};

/**
 * Formats template for export
 * @param {object} template - Template object
 * @param {string} format - Export format ('json', 'csv', 'summary')
 * @returns {string|object} - Formatted template
 */
export const formatTemplateForExport = (template, format = 'json') => {
  if (!template || typeof template !== 'object') {
    return null;
  }

  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(template, null, 2);

    case 'csv': {
      const csvRow = [
        template.id || '',
        template.name || '',
        template.status || '',
        template.type || '',
        template.createdAt || '',
      ];
      return csvRow.map(field => `"${field}"`).join(',');
    }

    case 'summary':
      return {
        id: template.id,
        name: template.name,
        status: template.status,
        type: template.type,
        lastModified: template.updatedAt || template.createdAt,
      };

    default:
      return template;
  }
};
