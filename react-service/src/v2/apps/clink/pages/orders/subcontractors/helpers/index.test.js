import { getOrderStatusColor, getApproverInitials } from './index';

describe('Orders Helpers', () => {
  describe('getOrderStatusColor', () => {
    it('should return success for approved status', () => {
      expect(getOrderStatusColor('approved')).toBe('success');
      expect(getOrderStatusColor('APPROVED')).toBe('success');
      expect(getOrderStatusColor('Approved')).toBe('success');
    });

    it('should return warning for pending status', () => {
      expect(getOrderStatusColor('pending')).toBe('warning');
      expect(getOrderStatusColor('PENDING')).toBe('warning');
      expect(getOrderStatusColor('Pending')).toBe('warning');
    });

    it('should return error for rejected status', () => {
      expect(getOrderStatusColor('rejected')).toBe('error');
      expect(getOrderStatusColor('REJECTED')).toBe('error');
      expect(getOrderStatusColor('Rejected')).toBe('error');
    });

    it('should return disabled for unknown status', () => {
      expect(getOrderStatusColor('unknown')).toBe('disabled');
      expect(getOrderStatusColor('')).toBe('disabled');
      expect(getOrderStatusColor(null)).toBe('disabled');
      expect(getOrderStatusColor(undefined)).toBe('disabled');
    });
  });

  describe('getApproverInitials', () => {
    it('should return initials for valid first and last name', () => {
      expect(getApproverInitials('John', 'Doe')).toBe('JD');
      expect(getApproverInitials('jane', 'smith')).toBe('JS');
    });

    it('should handle empty or missing names', () => {
      expect(getApproverInitials('', '')).toBe('');
      expect(getApproverInitials('John', '')).toBe('J');
      expect(getApproverInitials('', 'Doe')).toBe('D');
      expect(getApproverInitials(null, null)).toBe('');
      expect(getApproverInitials(undefined, undefined)).toBe('');
    });

    it('should return only first character of each name', () => {
      expect(getApproverInitials('Jonathan', 'MacDonald')).toBe('JM');
    });
  });
});