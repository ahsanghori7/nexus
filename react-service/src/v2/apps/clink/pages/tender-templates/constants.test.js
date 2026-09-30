import {
  TEMPLATE_STATUS,
  TEMPLATE_TYPES,
  DEFAULT_TEMPLATE_CONFIG,
  isValidStatus,
  isValidType,
  getStatusDisplayName,
  getTypeDisplayName,
  createDefaultTemplate,
  isTemplateEditable,
  isTemplateDeletable,
  getTemplateColor,
  getTemplateAge,
  formatTemplateAge,
  validatePermissions,
  sanitizeTemplateName,
  generateTemplateSlug,
} from './constants';

describe('Template Constants and Utilities', () => {
  describe('constants', () => {
    test('TEMPLATE_STATUS contains expected values', () => {
      expect(TEMPLATE_STATUS.ACTIVE).toBe('active');
      expect(TEMPLATE_STATUS.INACTIVE).toBe('inactive');
      expect(TEMPLATE_STATUS.DRAFT).toBe('draft');
      expect(TEMPLATE_STATUS.ARCHIVED).toBe('archived');
      expect(TEMPLATE_STATUS.PENDING).toBe('pending');
    });

    test('TEMPLATE_TYPES contains expected values', () => {
      expect(TEMPLATE_TYPES.STANDARD).toBe('standard');
      expect(TEMPLATE_TYPES.CUSTOM).toBe('custom');
      expect(TEMPLATE_TYPES.SYSTEM).toBe('system');
      expect(TEMPLATE_TYPES.USER).toBe('user');
    });

    test('DEFAULT_TEMPLATE_CONFIG has expected structure', () => {
      expect(DEFAULT_TEMPLATE_CONFIG).toHaveProperty('name');
      expect(DEFAULT_TEMPLATE_CONFIG).toHaveProperty('status');
      expect(DEFAULT_TEMPLATE_CONFIG).toHaveProperty('type');
      expect(DEFAULT_TEMPLATE_CONFIG).toHaveProperty('version');
      expect(DEFAULT_TEMPLATE_CONFIG).toHaveProperty('settings');
      expect(DEFAULT_TEMPLATE_CONFIG).toHaveProperty('permissions');
    });
  });

  describe('isValidStatus', () => {
    test('returns true for valid statuses', () => {
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('inactive')).toBe(true);
      expect(isValidStatus('draft')).toBe(true);
      expect(isValidStatus('archived')).toBe(true);
      expect(isValidStatus('pending')).toBe(true);
    });

    test('returns false for invalid statuses', () => {
      expect(isValidStatus('invalid')).toBe(false);
      expect(isValidStatus('')).toBe(false);
      expect(isValidStatus(null)).toBe(false);
      expect(isValidStatus(undefined)).toBe(false);
    });
  });

  describe('isValidType', () => {
    test('returns true for valid types', () => {
      expect(isValidType('standard')).toBe(true);
      expect(isValidType('custom')).toBe(true);
      expect(isValidType('system')).toBe(true);
      expect(isValidType('user')).toBe(true);
    });

    test('returns false for invalid types', () => {
      expect(isValidType('invalid')).toBe(false);
      expect(isValidType('')).toBe(false);
      expect(isValidType(null)).toBe(false);
      expect(isValidType(undefined)).toBe(false);
    });
  });

  describe('getStatusDisplayName', () => {
    test('returns correct display names', () => {
      expect(getStatusDisplayName('active')).toBe('Active');
      expect(getStatusDisplayName('inactive')).toBe('Inactive');
      expect(getStatusDisplayName('draft')).toBe('Draft');
      expect(getStatusDisplayName('archived')).toBe('Archived');
      expect(getStatusDisplayName('pending')).toBe('Pending');
    });

    test('returns Unknown for invalid status', () => {
      expect(getStatusDisplayName('invalid')).toBe('Unknown');
      expect(getStatusDisplayName('')).toBe('Unknown');
      expect(getStatusDisplayName(null)).toBe('Unknown');
    });
  });

  describe('getTypeDisplayName', () => {
    test('returns correct display names', () => {
      expect(getTypeDisplayName('standard')).toBe('Standard');
      expect(getTypeDisplayName('custom')).toBe('Custom');
      expect(getTypeDisplayName('system')).toBe('System');
      expect(getTypeDisplayName('user')).toBe('User');
    });

    test('returns Unknown for invalid type', () => {
      expect(getTypeDisplayName('invalid')).toBe('Unknown');
      expect(getTypeDisplayName('')).toBe('Unknown');
      expect(getTypeDisplayName(null)).toBe('Unknown');
    });
  });

  describe('createDefaultTemplate', () => {
    test('creates template with default values', () => {
      const template = createDefaultTemplate();
      
      expect(template.id).toBeNull();
      expect(template.name).toBe('');
      expect(template.status).toBe('draft');
      expect(template.type).toBe('standard');
      expect(template.version).toBe('1.0.0');
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
    });

    test('applies overrides correctly', () => {
      const overrides = {
        id: 123,
        name: 'Test Template',
        status: 'active',
      };
      
      const template = createDefaultTemplate(overrides);
      
      expect(template.id).toBe(123);
      expect(template.name).toBe('Test Template');
      expect(template.status).toBe('active');
      expect(template.type).toBe('standard'); // Default value preserved
    });

    test('sets timestamps', () => {
      const before = new Date();
      const template = createDefaultTemplate();
      const after = new Date();
      
      const createdAt = new Date(template.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('isTemplateEditable', () => {
    const baseTemplate = {
      id: 1,
      type: 'standard',
      status: 'draft',
      permissions: { read: true, write: true, delete: false, share: false },
    };

    test('returns true for editable template', () => {
      expect(isTemplateEditable(baseTemplate)).toBe(true);
    });

    test('returns false for system templates', () => {
      const systemTemplate = { ...baseTemplate, type: 'system' };
      expect(isTemplateEditable(systemTemplate)).toBe(false);
    });

    test('returns false for archived templates', () => {
      const archivedTemplate = { ...baseTemplate, status: 'archived' };
      expect(isTemplateEditable(archivedTemplate)).toBe(false);
    });

    test('returns false when write permission is false', () => {
      const noWriteTemplate = {
        ...baseTemplate,
        permissions: { ...baseTemplate.permissions, write: false },
      };
      expect(isTemplateEditable(noWriteTemplate)).toBe(false);
    });

    test('returns false when user does not own template and is not admin', () => {
      const ownedTemplate = { ...baseTemplate, ownerId: 'owner123' };
      const user = { id: 'user456', roles: ['user'] };
      
      expect(isTemplateEditable(ownedTemplate, user)).toBe(false);
    });

    test('returns true when user is admin', () => {
      const ownedTemplate = { ...baseTemplate, ownerId: 'owner123' };
      const adminUser = { id: 'user456', roles: ['admin'] };
      
      expect(isTemplateEditable(ownedTemplate, adminUser)).toBe(true);
    });

    test('returns false for null template', () => {
      expect(isTemplateEditable(null)).toBe(false);
    });
  });

  describe('isTemplateDeletable', () => {
    const baseTemplate = {
      id: 1,
      type: 'standard',
      permissions: { read: true, write: true, delete: true, share: false },
    };

    test('returns true for deletable template', () => {
      expect(isTemplateDeletable(baseTemplate)).toBe(true);
    });

    test('returns false for system templates', () => {
      const systemTemplate = { ...baseTemplate, type: 'system' };
      expect(isTemplateDeletable(systemTemplate)).toBe(false);
    });

    test('returns false when delete permission is false', () => {
      const noDeleteTemplate = {
        ...baseTemplate,
        permissions: { ...baseTemplate.permissions, delete: false },
      };
      expect(isTemplateDeletable(noDeleteTemplate)).toBe(false);
    });

    test('returns false when user does not own template and is not admin', () => {
      const ownedTemplate = { ...baseTemplate, ownerId: 'owner123' };
      const user = { id: 'user456', roles: ['user'] };
      
      expect(isTemplateDeletable(ownedTemplate, user)).toBe(false);
    });

    test('returns true when user is admin', () => {
      const ownedTemplate = { ...baseTemplate, ownerId: 'owner123' };
      const adminUser = { id: 'user456', roles: ['admin'] };
      
      expect(isTemplateDeletable(ownedTemplate, adminUser)).toBe(true);
    });
  });

  describe('getTemplateColor', () => {
    test('returns correct colors for statuses', () => {
      expect(getTemplateColor('active')).toBe('#4caf50');
      expect(getTemplateColor('inactive')).toBe('#f44336');
      expect(getTemplateColor('draft')).toBe('#ff9800');
      expect(getTemplateColor('archived')).toBe('#9e9e9e');
      expect(getTemplateColor('pending')).toBe('#2196f3');
    });

    test('returns default color for unknown status', () => {
      expect(getTemplateColor('unknown')).toBe('#000000');
      expect(getTemplateColor('')).toBe('#000000');
      expect(getTemplateColor(null)).toBe('#000000');
    });
  });

  describe('getTemplateAge', () => {
    test('calculates age correctly', () => {
      // Use a fixed date to avoid time boundary issues
      const yesterday = new Date('2023-01-01T12:00:00.000Z');
      const today = new Date('2023-01-02T12:00:00.000Z');
      
      // Mock Date constructor to return fixed date for "now"
      const OriginalDate = global.Date;
      global.Date = jest.fn((arg) => {
        if (arg === undefined) {
          return today;
        }
        return new OriginalDate(arg);
      });
      global.Date.now = jest.fn(() => today.getTime());
      
      expect(getTemplateAge(yesterday)).toBe(1);
      
      // Restore original Date
      global.Date = OriginalDate;
    });

    test('returns 0 for today', () => {
      const today = new Date();
      // Create a date at the start of today to ensure 0 days difference
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      expect(getTemplateAge(todayStart)).toBe(0);
    });

    test('handles string dates', () => {
      // Use a fixed date to avoid time boundary issues
      const yesterday = new Date('2023-01-01T12:00:00.000Z');
      const today = new Date('2023-01-02T12:00:00.000Z');
      
      // Mock Date constructor to return fixed date for "now"
      const OriginalDate = global.Date;
      global.Date = jest.fn((arg) => {
        if (arg === undefined) {
          return today;
        }
        return new OriginalDate(arg);
      });
      global.Date.now = jest.fn(() => today.getTime());
      
      expect(getTemplateAge(yesterday.toISOString())).toBe(1);
      
      // Restore original Date
      global.Date = OriginalDate;
    });

    test('returns 0 for invalid dates', () => {
      expect(getTemplateAge('invalid-date')).toBe(0);
      expect(getTemplateAge(null)).toBe(0);
      expect(getTemplateAge(undefined)).toBe(0);
    });
  });

  describe('formatTemplateAge', () => {
    test('formats days correctly', () => {
      expect(formatTemplateAge(0)).toBe('Today');
      expect(formatTemplateAge(1)).toBe('1 day ago');
      expect(formatTemplateAge(3)).toBe('3 days ago');
    });

    test('formats weeks correctly', () => {
      expect(formatTemplateAge(7)).toBe('1 week ago');
      expect(formatTemplateAge(14)).toBe('2 weeks ago');
    });

    test('formats months correctly', () => {
      expect(formatTemplateAge(30)).toBe('1 month ago');
      expect(formatTemplateAge(60)).toBe('2 months ago');
    });

    test('formats years correctly', () => {
      expect(formatTemplateAge(365)).toBe('1 year ago');
      expect(formatTemplateAge(730)).toBe('2 years ago');
    });
  });

  describe('validatePermissions', () => {
    test('returns true for valid permissions', () => {
      const permissions = {
        read: true,
        write: false,
        delete: false,
        share: true,
      };
      
      expect(validatePermissions(permissions)).toBe(true);
    });

    test('returns false for missing fields', () => {
      const permissions = {
        read: true,
        write: false,
        // missing delete and share
      };
      
      expect(validatePermissions(permissions)).toBe(false);
    });

    test('returns false for non-boolean values', () => {
      const permissions = {
        read: 'true', // string instead of boolean
        write: false,
        delete: false,
        share: false,
      };
      
      expect(validatePermissions(permissions)).toBe(false);
    });

    test('returns false for invalid input', () => {
      expect(validatePermissions(null)).toBe(false);
      expect(validatePermissions(undefined)).toBe(false);
      expect(validatePermissions('string')).toBe(false);
    });
  });

  describe('sanitizeTemplateName', () => {
    test('removes invalid characters', () => {
      expect(sanitizeTemplateName('Template<script>test')).toBe('Templatescripttest');
      expect(sanitizeTemplateName('Template/with/slashes')).toBe('Templatewithslashes');
      expect(sanitizeTemplateName('Template:with:colons')).toBe('Templatewithcolons');
    });

    test('trims whitespace', () => {
      expect(sanitizeTemplateName('  Template Name  ')).toBe('Template Name');
    });

    test('replaces multiple spaces', () => {
      expect(sanitizeTemplateName('Template    Name')).toBe('Template Name');
    });

    test('limits length', () => {
      const longName = 'a'.repeat(150);
      const sanitized = sanitizeTemplateName(longName);
      expect(sanitized.length).toBe(100);
    });

    test('handles invalid input', () => {
      expect(sanitizeTemplateName(null)).toBe('');
      expect(sanitizeTemplateName(undefined)).toBe('');
      expect(sanitizeTemplateName(123)).toBe('');
    });
  });

  describe('generateTemplateSlug', () => {
    test('creates URL-friendly slug', () => {
      expect(generateTemplateSlug('Template Name')).toBe('template-name');
      expect(generateTemplateSlug('My Special Template!')).toBe('my-special-template');
    });

    test('handles multiple spaces and hyphens', () => {
      expect(generateTemplateSlug('Template    Name')).toBe('template-name');
      expect(generateTemplateSlug('Template---Name')).toBe('template-name');
    });

    test('removes leading and trailing hyphens', () => {
      expect(generateTemplateSlug('-Template Name-')).toBe('template-name');
    });

    test('handles special characters', () => {
      expect(generateTemplateSlug('Template@#$%Name')).toBe('templatename');
    });

    test('handles invalid input', () => {
      expect(generateTemplateSlug(null)).toBe('');
      expect(generateTemplateSlug(undefined)).toBe('');
      expect(generateTemplateSlug(123)).toBe('');
    });

    test('handles empty or whitespace-only input', () => {
      expect(generateTemplateSlug('')).toBe('');
      expect(generateTemplateSlug('   ')).toBe('');
    });
  });
});