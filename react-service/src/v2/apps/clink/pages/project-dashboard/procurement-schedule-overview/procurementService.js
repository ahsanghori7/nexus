const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

const formatDate = (date) => {
  if (!date) return '—';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const generateRows = (overview) => {
  const rows = [];
  overview.forEach((item) => {
    const { status, issue_order, start_on_site } = item;

    let currentMilestoneData =
      typeof item?.current_milestone === 'boolean' ? false : null;
    if (item.current_milestone) {
      const newDate = isValidDate(item.current_milestone?.date)
        ? new Date(item.current_milestone.date)
        : null;
      currentMilestoneData = {
        dueDate: newDate,
        ...item.current_milestone,
      };
    }

    let nextMilestoneData =
      typeof item?.next_milestone === 'boolean' ? false : null;
    if (item.next_milestone) {
      const newDate = isValidDate(item.next_milestone?.date)
        ? new Date(item.next_milestone.date)
        : null;
      nextMilestoneData = {
        dueDate: newDate,
        ...item.next_milestone,
      };
    }

    let completeMilestoneData = [];
    if (item.complete_milestone) {
      if (Array.isArray(item.complete_milestone)) {
        completeMilestoneData = item.complete_milestone.map((milestone) => ({
          ...milestone,
        }));
      }
    }

    rows.push({
      ...item,
      currentMilestoneData,
      status: (status && status?.trim()) || '',
      nextMilestoneData,
      completeMilestoneData,
      orderIssueDate: issue_order && formatDate(issue_order),
      startOnSite: start_on_site && formatDate(start_on_site),
      startOnSiteUnformatted: start_on_site,
      issueOrderUnformatted: issue_order,
    });
  });

  return rows;
};

const calculateProcurementProgress = (rows) => {
  const totalPackages = rows.length;
  const packagesInProgress = rows.filter(
    (row) => row?.status && row?.status?.trim() === 'In Progress',
  ).length;
  return {
    percentage:
      totalPackages > 0
        ? Math.round((packagesInProgress / totalPackages) * 100)
        : 0,
    ratio: `${packagesInProgress}/${totalPackages}`,
  };
};

const countPackagesAtRisk = (rows) => {
  return rows.filter(
    (row) =>
      (row?.nextMilestoneData?.risk?.trim() === 'Approaching' ||
        row?.nextMilestoneData?.risk?.trim() === 'Overdue') &&
      row?.status?.trim() !== 'Complete',
  ).length;
};

// Mock service functions for settings-modal data
const fetchMilestones = () => {
  return [
    {
      id: 'issue-tender',
      name: 'Issue Tender',
      defaultLeadTime: 12, // 12 weeks from start on site date
      description: 'When tender documents should be issued',
    },
    {
      id: 'quote-due',
      name: 'Quote Due ',
      defaultLeadTime: 8, // 8 weeks from start on site date
      description: 'When quotes are expected back from subcontractors',
    },
    {
      id: 'issue-order',
      name: 'Issue Order',
      defaultLeadTime: 4, // 4 weeks from start on site date
      description: 'When the order should be placed with the subcontractor',
    },
  ];
};

export {
  generateRows,
  calculateProcurementProgress,
  countPackagesAtRisk,
  fetchMilestones,
  isValidDate,
};
