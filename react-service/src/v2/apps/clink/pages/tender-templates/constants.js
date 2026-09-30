// Template constants and simple utility functions

/**
 * Template status constants
 */
export const TEMPLATE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
  PENDING: 'pending',
};

/**
 * Template type constants
 */
export const TEMPLATE_TYPES = {
  STANDARD: 'standard',
  CUSTOM: 'custom',
  SYSTEM: 'system',
  USER: 'user',
};

/**
 * Default template configuration
 */
export const DEFAULT_TEMPLATE_CONFIG = {
  name: '',
  status: TEMPLATE_STATUS.DRAFT,
  type: TEMPLATE_TYPES.STANDARD,
  version: '1.0.0',
  settings: {
    autoSave: true,
    notifications: true,
    backup: false,
  },
  permissions: {
    read: true,
    write: false,
    delete: false,
    share: false,
  },
};

/**
 * Checks if a status is valid
 * @param {string} status - Status to validate
 * @returns {boolean} - Whether status is valid
 */
export const isValidStatus = (status) => {
  return Object.values(TEMPLATE_STATUS).includes(status);
};

/**
 * Checks if a type is valid
 * @param {string} type - Type to validate
 * @returns {boolean} - Whether type is valid
 */
export const isValidType = (type) => {
  return Object.values(TEMPLATE_TYPES).includes(type);
};

/**
 * Gets the display name for a status
 * @param {string} status - Status code
 * @returns {string} - Display name
 */
export const getStatusDisplayName = (status) => {
  const statusMap = {
    [TEMPLATE_STATUS.ACTIVE]: 'Active',
    [TEMPLATE_STATUS.INACTIVE]: 'Inactive',
    [TEMPLATE_STATUS.DRAFT]: 'Draft',
    [TEMPLATE_STATUS.ARCHIVED]: 'Archived',
    [TEMPLATE_STATUS.PENDING]: 'Pending',
  };

  return statusMap[status] || 'Unknown';
};

/**
 * Gets the display name for a type
 * @param {string} type - Type code
 * @returns {string} - Display name
 */
export const getTypeDisplayName = (type) => {
  const typeMap = {
    [TEMPLATE_TYPES.STANDARD]: 'Standard',
    [TEMPLATE_TYPES.CUSTOM]: 'Custom',
    [TEMPLATE_TYPES.SYSTEM]: 'System',
    [TEMPLATE_TYPES.USER]: 'User',
  };

  return typeMap[type] || 'Unknown';
};

/**
 * Creates a new template with default values
 * @param {object} overrides - Values to override
 * @returns {object} - New template object
 */
export const createDefaultTemplate = (overrides = {}) => {
  const timestamp = new Date().toISOString();

  return {
    id: null,
    ...DEFAULT_TEMPLATE_CONFIG,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
};

/**
 * Checks if a template is editable
 * @param {object} template - Template to check
 * @param {object} user - Current user
 * @returns {boolean} - Whether template is editable
 */
export const isTemplateEditable = (template, user = {}) => {
  if (!template) return false;

  // System templates are not editable
  if (template.type === TEMPLATE_TYPES.SYSTEM) {
    return false;
  }

  // Archived templates are not editable
  if (template.status === TEMPLATE_STATUS.ARCHIVED) {
    return false;
  }

  // Check permissions
  if (template.permissions && !template.permissions.write) {
    return false;
  }

  // Check if user owns the template
  if (template.ownerId && user.id && template.ownerId !== user.id) {
    // Check if user has admin role
    if (!user.roles || !user.roles.includes('admin')) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if a template is deletable
 * @param {object} template - Template to check
 * @param {object} user - Current user
 * @returns {boolean} - Whether template is deletable
 */
export const isTemplateDeletable = (template, user = {}) => {
  if (!template) return false;

  // System templates are not deletable
  if (template.type === TEMPLATE_TYPES.SYSTEM) {
    return false;
  }

  // Check permissions
  if (template.permissions && !template.permissions.delete) {
    return false;
  }

  // Check if user owns the template
  if (template.ownerId && user.id && template.ownerId !== user.id) {
    // Check if user has admin role
    if (!user.roles || !user.roles.includes('admin')) {
      return false;
    }
  }

  return true;
};

/**
 * Gets template color based on status
 * @param {string} status - Template status
 * @returns {string} - Color code
 */
export const getTemplateColor = (status) => {
  const colorMap = {
    [TEMPLATE_STATUS.ACTIVE]: '#4caf50', // Green
    [TEMPLATE_STATUS.INACTIVE]: '#f44336', // Red
    [TEMPLATE_STATUS.DRAFT]: '#ff9800', // Orange
    [TEMPLATE_STATUS.ARCHIVED]: '#9e9e9e', // Grey
    [TEMPLATE_STATUS.PENDING]: '#2196f3', // Blue
  };

  return colorMap[status] || '#000000';
};

/**
 * Calculates template age in days
 * @param {string|Date} createdAt - Creation date
 * @returns {number} - Age in days
 */
export const getTemplateAge = (createdAt) => {
  if (!createdAt) return 0;

  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return 0;

  const now = new Date();

  // Normalize both dates to midnight to calculate full days
  const createdMidnight = new Date(created);
  createdMidnight.setHours(0, 0, 0, 0);

  const nowMidnight = new Date(now);
  nowMidnight.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(nowMidnight - createdMidnight);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Formats template age for display
 * @param {number} days - Age in days
 * @returns {string} - Formatted age
 */
export const formatTemplateAge = (days) => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
};

/**
 * Validates template permissions
 * @param {object} permissions - Permissions object
 * @returns {boolean} - Whether permissions are valid
 */
export const validatePermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return false;
  }

  const requiredFields = ['read', 'write', 'delete', 'share'];

  return requiredFields.every(
    (field) =>
      Object.prototype.hasOwnProperty.call(permissions, field) &&
      typeof permissions[field] === 'boolean',
  );
};

/**
 * Sanitizes template name
 * @param {string} name - Template name
 * @returns {string} - Sanitized name
 */
export const sanitizeTemplateName = (name) => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 100); // Limit length
};

/**
 * Generates template slug from name
 * @param {string} name - Template name
 * @returns {string} - URL-friendly slug
 */
export const generateTemplateSlug = (name) => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};
