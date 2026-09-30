import {
  generateRows,
  calculateProcurementProgress,
  countPackagesAtRisk,
  fetchMilestones,
  isValidDate,
} from './procurementService';

describe('procurementService', () => {
  describe('isValidDate', () => {
    it('returns false for null/undefined dates', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('returns true for valid date strings', () => {
      expect(isValidDate('2023-12-25')).toBe(true);
      expect(isValidDate('December 25, 2023')).toBe(true);
    });

    it('returns false for invalid date strings', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2023-13-35')).toBe(false);
    });

    it('returns true for valid Date objects', () => {
      expect(isValidDate(new Date('2023-12-25'))).toBe(true);
    });

    it('returns false for invalid Date objects', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('generateRows', () => {
    it('generates rows from empty overview', () => {
      const result = generateRows([]);
      expect(result).toEqual([]);
    });

    it('generates rows from overview with basic item', () => {
      const overview = [
        {
          id: 1,
          name: 'Test Package',
          status: 'Active',
          issue_order: '2023-12-25',
          start_on_site: '2024-01-15',
        },
      ];

      const result = generateRows(overview);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Test Package',
        status: 'Active',
        orderIssueDate: '25 Dec 2023',
        startOnSite: '15 Jan 2024',
        startOnSiteUnformatted: '2024-01-15',
        issueOrderUnformatted: '2023-12-25',
      });
    });

    it('handles items with current milestone', () => {
      const overview = [
        {
          id: 1,
          current_milestone: {
            date: '2023-12-01',
            name: 'Test Milestone',
            risk: 'On Track',
          },
        },
      ];

      const result = generateRows(overview);
      
      expect(result[0].currentMilestoneData).toMatchObject({
        dueDate: new Date('2023-12-01'),
        name: 'Test Milestone',
        risk: 'On Track',
      });
    });

    it('handles items with next milestone', () => {
      const overview = [
        {
          id: 1,
          next_milestone: {
            date: '2024-01-01',
            name: 'Next Milestone',
            risk: 'Approaching',
          },
        },
      ];

      const result = generateRows(overview);
      
      expect(result[0].nextMilestoneData).toMatchObject({
        dueDate: new Date('2024-01-01'),
        name: 'Next Milestone',
        risk: 'Approaching',
      });
    });

    it('handles boolean milestone values', () => {
      const overview = [
        {
          id: 1,
          current_milestone: false,
          next_milestone: false,
        },
      ];

      const result = generateRows(overview);
      
      expect(result[0].currentMilestoneData).toBe(false);
      expect(result[0].nextMilestoneData).toBe(false);
    });

    it('handles invalid dates in milestones', () => {
      const overview = [
        {
          id: 1,
          current_milestone: {
            date: 'invalid-date',
            name: 'Test Milestone',
          },
        },
      ];

      const result = generateRows(overview);
      
      expect(result[0].currentMilestoneData.dueDate).toBeNull();
    });

    it('trims whitespace from status', () => {
      const overview = [
        {
          id: 1,
          status: '  Active  ',
        },
      ];

      const result = generateRows(overview);
      
      expect(result[0].status).toBe('Active');
    });

    it('handles null/undefined dates', () => {
      const overview = [
        {
          id: 1,
          issue_order: null,
          start_on_site: undefined,
        },
      ];

      const result = generateRows(overview);
      
      expect(result[0].orderIssueDate).toBeNull();
      expect(result[0].startOnSite).toBeUndefined();
    });
  });

  describe('calculateProcurementProgress', () => {
    it('calculates progress for empty array', () => {
      const result = calculateProcurementProgress([]);
      expect(result).toEqual({
        percentage: 0,
        ratio: '0/0',
      });
    });

    it('calculates progress with no packages in progress', () => {
      const rows = [
        { status: 'Complete' },
        { status: 'Not Started' },
      ];

      const result = calculateProcurementProgress(rows);
      expect(result).toEqual({
        percentage: 0,
        ratio: '0/2',
      });
    });

    it('calculates progress with some packages in progress', () => {
      const rows = [
        { status: 'In Progress' },
        { status: 'In Progress' },
        { status: 'Complete' },
        { status: 'Not Started' },
      ];

      const result = calculateProcurementProgress(rows);
      expect(result).toEqual({
        percentage: 50, // 2/4 = 0.5 = 50%
        ratio: '2/4',
      });
    });

    it('handles status with whitespace', () => {
      const rows = [
        { status: '  In Progress  ' },
        { status: 'Complete' },
      ];

      const result = calculateProcurementProgress(rows);
      expect(result).toEqual({
        percentage: 50,
        ratio: '1/2',
      });
    });

    it('rounds percentage correctly', () => {
      const rows = [
        { status: 'In Progress' },
        { status: 'Complete' },
        { status: 'Not Started' },
      ];

      const result = calculateProcurementProgress(rows);
      expect(result).toEqual({
        percentage: 33, // 1/3 = 0.333... rounds to 33
        ratio: '1/3',
      });
    });
  });

  describe('countPackagesAtRisk', () => {
    it('counts packages at risk correctly', () => {
      const rows = [
        {
          status: 'In Progress',
          nextMilestoneData: { risk: 'Approaching' },
        },
        {
          status: 'In Progress', 
          nextMilestoneData: { risk: 'Overdue' },
        },
        {
          status: 'Complete', // Should be excluded
          nextMilestoneData: { risk: 'Overdue' },
        },
        {
          status: 'In Progress',
          nextMilestoneData: { risk: 'On Track' }, // Should be excluded
        },
      ];

      const result = countPackagesAtRisk(rows);
      expect(result).toBe(2);
    });

    it('handles whitespace in risk and status', () => {
      const rows = [
        {
          status: '  In Progress  ',
          nextMilestoneData: { risk: '  Approaching  ' },
        },
        {
          status: '  Complete  ',
          nextMilestoneData: { risk: '  Overdue  ' },
        },
      ];

      const result = countPackagesAtRisk(rows);
      expect(result).toBe(1); // Only first one should count
    });

    it('returns 0 for empty array', () => {
      const result = countPackagesAtRisk([]);
      expect(result).toBe(0);
    });

    it('returns 0 when no packages are at risk', () => {
      const rows = [
        {
          status: 'In Progress',
          nextMilestoneData: { risk: 'On Track' },
        },
        {
          status: 'Complete',
          nextMilestoneData: { risk: 'Approaching' },
        },
      ];

      const result = countPackagesAtRisk(rows);
      expect(result).toBe(0);
    });

    it('handles missing nextMilestoneData', () => {
      const rows = [
        {
          status: 'In Progress',
          nextMilestoneData: null,
        },
        {
          status: 'In Progress',
          // nextMilestoneData missing
        },
      ];

      const result = countPackagesAtRisk(rows);
      expect(result).toBe(0);
    });
  });

  describe('fetchMilestones', () => {
    it('returns expected milestone structure', () => {
      const milestones = fetchMilestones();
      
      expect(milestones).toHaveLength(3);
      expect(milestones[0]).toMatchObject({
        id: 'issue-tender',
        name: 'Issue Tender',
        defaultLeadTime: 12,
        description: expect.any(String),
      });
      expect(milestones[1]).toMatchObject({
        id: 'quote-due',
        name: 'Quote Due ',
        defaultLeadTime: 8,
        description: expect.any(String),
      });
      expect(milestones[2]).toMatchObject({
        id: 'issue-order',
        name: 'Issue Order',
        defaultLeadTime: 4,
        description: expect.any(String),
      });
    });

    it('returns consistent data on multiple calls', () => {
      const milestones1 = fetchMilestones();
      const milestones2 = fetchMilestones();
      
      expect(milestones1).toEqual(milestones2);
    });
  });
});