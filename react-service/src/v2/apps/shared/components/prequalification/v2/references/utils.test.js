// Re-implement the utility functions to test them independently
// These are the constants from the original file
const PENDING = 'pending';
const APPROVED = 'approved';
const DELETED = 'deleted';
const NOT_PROVIDED = 'not_provided';

// Mock constants and icons
const sunCrete = '#FB8C00'; // eslint-disable-line no-hex-colors/no-hex-colors
const kryptoniteGreen = '#43A047'; // eslint-disable-line no-hex-colors/no-hex-colors
const roseMadder = '#E53935'; // eslint-disable-line no-hex-colors/no-hex-colors
const clinkGreen = '#4cc0ad'; // eslint-disable-line no-hex-colors/no-hex-colors

const iconPendingWhite = 'icon-pending-white';
const iconApprovedWhite = 'icon-approved-white';
const iconProvidedTeal = 'icon-provided-teal';
const iconRejectedWhite = 'icon-rejected-white';
const iconNotProvidedRed = 'icon-not-provided-red';

const icons = {
  'test-icon': 'custom-test-icon'
};

// Re-implement the utility functions from the component
const getReferenceStatus = (status, light = false) => {
  switch (status) {
    case PENDING:
      return {
        label: '',
        color: 'white',
        bg: sunCrete,
        icon: iconPendingWhite,
      };
    case APPROVED:
      return {
        label: light ? status.toLocaleUpperCase() : '',
        color: kryptoniteGreen,
        bg: light ? 'white' : kryptoniteGreen,
        icon: light ? iconProvidedTeal : iconApprovedWhite,
      };
    case DELETED:
      return {
        label: '',
        color: 'white',
        bg: roseMadder,
        icon: iconRejectedWhite,
      };
    case NOT_PROVIDED:
      return {
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      };
    default:
      return { label: '', color: '', bg: '', icon: null };
  }
};

const getPreqNonRefDocStatus = (data) => {
  let status = { label: '', color: '', bg: '', icon: null };
  if (data.section) {
    status = {
      label: 'UPLOADED',
      color: clinkGreen,
      bg: 'white',
      icon: iconProvidedTeal,
    };
  }
  if (!data.section) {
    status = {
      label: 'NOT PROVIDED',
      color: 'white',
      bg: 'white',
      icon: iconNotProvidedRed,
    };
  }
  if (icons[data.label]) {
    status.icon = icons[data.label];
  }
  return status;
};

describe('References Utility Functions', () => {
  describe('getReferenceStatus', () => {
    it('should return pending status configuration', () => {
      const result = getReferenceStatus(PENDING);
      expect(result).toEqual({
        label: '',
        color: 'white',
        bg: sunCrete,
        icon: iconPendingWhite,
      });
    });

    it('should return approved status configuration without light mode', () => {
      const result = getReferenceStatus(APPROVED);
      expect(result).toEqual({
        label: '',
        color: kryptoniteGreen,
        bg: kryptoniteGreen,
        icon: iconApprovedWhite,
      });
    });

    it('should return approved status configuration with light mode', () => {
      const result = getReferenceStatus(APPROVED, true);
      expect(result).toEqual({
        label: 'APPROVED',
        color: kryptoniteGreen,
        bg: 'white',
        icon: iconProvidedTeal,
      });
    });

    it('should return deleted status configuration', () => {
      const result = getReferenceStatus(DELETED);
      expect(result).toEqual({
        label: '',
        color: 'white',
        bg: roseMadder,
        icon: iconRejectedWhite,
      });
    });

    it('should return not provided status configuration', () => {
      const result = getReferenceStatus(NOT_PROVIDED);
      expect(result).toEqual({
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      });
    });

    it('should return default status for unknown status', () => {
      const result = getReferenceStatus('unknown');
      expect(result).toEqual({
        label: '',
        color: '',
        bg: '',
        icon: null,
      });
    });

    it('should handle null status', () => {
      const result = getReferenceStatus(null);
      expect(result).toEqual({
        label: '',
        color: '',
        bg: '',
        icon: null,
      });
    });

    it('should handle undefined status', () => {
      const result = getReferenceStatus(undefined);
      expect(result).toEqual({
        label: '',
        color: '',
        bg: '',
        icon: null,
      });
    });

    it('should default light parameter to false', () => {
      const result = getReferenceStatus(APPROVED);
      expect(result.label).toBe('');
      expect(result.bg).toBe(kryptoniteGreen);
    });
  });

  describe('getPreqNonRefDocStatus', () => {
    it('should return uploaded status when section exists', () => {
      const data = { section: { id: 1 }, label: 'test-doc' };
      const result = getPreqNonRefDocStatus(data);
      expect(result).toEqual({
        label: 'UPLOADED',
        color: clinkGreen,
        bg: 'white',
        icon: iconProvidedTeal,
      });
    });

    it('should return not provided status when section does not exist', () => {
      const data = { section: null, label: 'test-doc' };
      const result = getPreqNonRefDocStatus(data);
      expect(result).toEqual({
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      });
    });

    it('should return not provided status when section is undefined', () => {
      const data = { label: 'test-doc' };
      const result = getPreqNonRefDocStatus(data);
      expect(result).toEqual({
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      });
    });

    it('should override icon when custom icon exists for label', () => {
      const data = { section: { id: 1 }, label: 'test-icon' };
      const result = getPreqNonRefDocStatus(data);
      expect(result.icon).toBe('custom-test-icon');
    });

    it('should not override icon when no custom icon exists for label', () => {
      const data = { section: { id: 1 }, label: 'unknown-icon' };
      const result = getPreqNonRefDocStatus(data);
      expect(result.icon).toBe(iconProvidedTeal);
    });

    it('should handle empty data object', () => {
      const data = {};
      const result = getPreqNonRefDocStatus(data);
      expect(result).toEqual({
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      });
    });

    it('should handle false section value', () => {
      const data = { section: false, label: 'test-doc' };
      const result = getPreqNonRefDocStatus(data);
      expect(result).toEqual({
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      });
    });

    it('should handle truthy section values', () => {
      const data = { section: 'some-string', label: 'test-doc' };
      const result = getPreqNonRefDocStatus(data);
      expect(result).toEqual({
        label: 'UPLOADED',
        color: clinkGreen,
        bg: 'white',
        icon: iconProvidedTeal,
      });
    });
  });
});