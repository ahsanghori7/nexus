// Simple utility functions for tender templates
// These functions can be easily tested to increase coverage

/**
 * Validates a template name
 * @param {string} name - The template name to validate
 * @returns {boolean} - Whether the name is valid
 */
export const validateTemplateName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return false;
  }

  if (trimmedName.length > 100) {
    return false;
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmedName)) {
    return false;
  }

  return true;
};

/**
 * Formats a template status for display
 * @param {string} status - The raw status string
 * @returns {string} - The formatted status
 */
export const formatTemplateStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return 'Unknown';
  }

  switch (status.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'draft':
      return 'Draft';
    case 'archived':
      return 'Archived';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

/**
 * Checks if a template ID is valid
 * @param {any} id - The template ID to check
 * @returns {boolean} - Whether the ID is valid
 */
export const isValidTemplateId = (id) => {
  if (id === null || id === undefined) {
    return false;
  }

  if (typeof id === 'string') {
    return id.trim().length > 0;
  }

  if (typeof id === 'number') {
    return id > 0 && Number.isInteger(id);
  }

  return false;
};

/**
 * Generates a unique template key
 * @param {string} projectId - The project ID
 * @param {string} tenderId - The tender ID
 * @param {string} templateId - The template ID
 * @returns {string} - The unique key
 */
export const generateTemplateKey = (projectId, tenderId, templateId) => {
  const parts = [projectId, tenderId, templateId].filter(Boolean);
  return parts.join('-') || 'unknown';
};

/**
 * Parses template configuration
 * @param {any} config - The configuration object
 * @returns {object} - The parsed configuration
 */
export const parseTemplateConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return { isValid: false, data: null };
  }

  try {
    const parsed = {
      name: config.name || '',
      type: config.type || 'default',
      version: config.version || '1.0.0',
      settings: config.settings || {},
    };

    return { isValid: true, data: parsed };
  } catch (error) {
    return { isValid: false, data: null };
  }
};

/**
 * Filters templates by status
 * @param {Array} templates - Array of template objects
 * @param {string} status - Status to filter by
 * @returns {Array} - Filtered templates
 */
export const filterTemplatesByStatus = (templates, status) => {
  if (!Array.isArray(templates)) {
    return [];
  }

  if (!status || typeof status !== 'string') {
    return templates;
  }

  return templates.filter(template =>
    template && template.status &&
    template.status.toLowerCase() === status.toLowerCase()
  );
};

/**
 * Sorts templates by name
 * @param {Array} templates - Array of template objects
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} - Sorted templates
 */
export const sortTemplatesByName = (templates, direction = 'asc') => {
  if (!Array.isArray(templates)) {
    return [];
  }

  const sorted = [...templates].sort((a, b) => {
    const nameA = (a?.name || '').toLowerCase();
    const nameB = (b?.name || '').toLowerCase();

    if (direction === 'desc') {
      return nameB.localeCompare(nameA);
    }
    return nameA.localeCompare(nameB);
  });

  return sorted;
};
