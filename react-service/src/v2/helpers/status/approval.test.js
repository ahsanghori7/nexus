import {
  DRAFT,
  REJECTION_ACKNOWLEDGED,
  isPending,
  isSelectableForApproval,
  getApproverRowsForUser,
  isCurrentUserAnApprover,
  isApprovableByUser,
} from 'v2/helpers/status/approval';

// Shape produced by GET project/{id}/shortlisted-subcontractors when isLevel.
const levelled = (levels) => ({ status: { label: 'Pending' }, approvals: levels });
const approverRow = (id, userId, label = 'Pending') => ({
  id,
  approver_user_id: userId,
  status: { label },
});

describe('status/approval.js', () => {
  describe('approval status constants', () => {
    test('should export DRAFT constant', () => {
      expect(DRAFT).toBe('Draft');
    });

    test('should export REJECTION_ACKNOWLEDGED constant', () => {
      expect(REJECTION_ACKNOWLEDGED).toBe('Rejection Acknowledged');
    });
  });

  describe('constant validation', () => {
    test('all constants should be strings', () => {
      const constants = [DRAFT, REJECTION_ACKNOWLEDGED];

      constants.forEach(constant => {
        expect(typeof constant).toBe('string');
        expect(constant.length).toBeGreaterThan(0);
      });
    });

    test('all constants should have unique values', () => {
      const constants = [DRAFT, REJECTION_ACKNOWLEDGED];

      const uniqueConstants = [...new Set(constants)];
      expect(uniqueConstants).toHaveLength(constants.length);
    });
  });

  describe('status grouping utilities', () => {
    test('should identify initial statuses', () => {
      const initialStatuses = [DRAFT];

      expect(initialStatuses).toContain(DRAFT);
      expect(initialStatuses).not.toContain(REJECTION_ACKNOWLEDGED);
    });

    test('should identify rejection statuses', () => {
      const rejectionStatuses = [REJECTION_ACKNOWLEDGED];

      expect(rejectionStatuses).toContain(REJECTION_ACKNOWLEDGED);
    });
  });

  describe('status workflow logic', () => {
    test('should support basic approval workflow', () => {
      const workflowStatuses = [DRAFT, REJECTION_ACKNOWLEDGED];

      workflowStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });

    test('rejection acknowledged should clearly indicate rejection', () => {
      expect(REJECTION_ACKNOWLEDGED).toMatch(/rejection/i);
    });
  });

  describe('isPending / isSelectableForApproval', () => {
    test('accepts both string and { label } status shapes', () => {
      expect(isPending('Pending')).toBe(true);
      expect(isPending({ label: 'Pending' })).toBe(true);
      expect(isPending({ label: 'Approved' })).toBe(false);
      expect(isPending(null)).toBe(false);
    });

    test('a missing status counts as a draft', () => {
      expect(isSelectableForApproval(null)).toBe(true);
      expect(isSelectableForApproval({ label: 'Rejection Acknowledged' })).toBe(true);
      expect(isSelectableForApproval({ label: 'Pending' })).toBe(false);
    });
  });

  describe('getApproverRowsForUser', () => {
    test('finds the user on an in-progress level', () => {
      const sub = levelled({ 1: { status: 'in_progress', approvers: [approverRow(10, 7)] } });
      expect(getApproverRowsForUser(sub, 7)).toHaveLength(1);
      expect(getApproverRowsForUser(sub, 7)[0].id).toBe(10);
    });

    test('ignores levels that have not started', () => {
      const sub = levelled({ 2: { status: 'locked', approvers: [approverRow(20, 7)] } });
      expect(getApproverRowsForUser(sub, 7)).toEqual([]);
    });

    test('ignores a decision the user has already made', () => {
      const sub = levelled({
        1: { status: 'in_progress', approvers: [approverRow(10, 7, 'Approved')] },
      });
      expect(getApproverRowsForUser(sub, 7)).toEqual([]);
      // ...but it is still their row when collecting approval ids.
      expect(getApproverRowsForUser(sub, 7, { pendingOnly: false })).toHaveLength(1);
    });

    test('handles the flat (non-levelled) approvals array', () => {
      const sub = { status: { label: 'Pending' }, approvals: [approverRow(10, 7)] };
      expect(getApproverRowsForUser(sub, 7)).toHaveLength(1);
    });

    test('matches ids across string/number types and rejects other users', () => {
      const sub = levelled({ 1: { status: 'in_progress', approvers: [approverRow(10, 7)] } });
      expect(getApproverRowsForUser(sub, '7')).toHaveLength(1);
      expect(getApproverRowsForUser(sub, 99)).toEqual([]);
    });

    test('is safe on missing input', () => {
      expect(getApproverRowsForUser(null, 7)).toEqual([]);
      expect(getApproverRowsForUser({}, 7)).toEqual([]);
      expect(getApproverRowsForUser(levelled({}), undefined)).toEqual([]);
    });
  });

  describe('isApprovableByUser', () => {
    test('requires both a Pending supplier and a pending decision from the user', () => {
      const mine = levelled({ 1: { status: 'in_progress', approvers: [approverRow(10, 7)] } });
      expect(isCurrentUserAnApprover(mine, 7)).toBe(true);
      expect(isApprovableByUser(mine, 7)).toBe(true);

      // Supplier already resolved, so nothing to action even though the row exists.
      const settled = { ...mine, status: { label: 'Approved' } };
      expect(isApprovableByUser(settled, 7)).toBe(false);
    });
  });
});
