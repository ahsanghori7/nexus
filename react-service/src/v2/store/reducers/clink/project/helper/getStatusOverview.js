import moment from 'moment';
import { getProperDates2 } from 'v2/helpers/date';

const milestones = {
  'issue-tender': 'Issue Tender',
  'quote-due': 'Quote Due',
  'issue-order': 'Issue Order',
  'start-on-site': 'Start on Site',
  'order-issued': 'Order Issued',
};

const getRiskCategory = (dueDateString) => {
  if (!dueDateString) return null; // Handle cases where date might be null or undefined
  const today = moment().startOf('day');
  const dueDate = moment(dueDateString).startOf('day');

  if (dueDate.isAfter(moment(today).add(7, 'days'))) {
    return 'On Track';
  }
  if (dueDate.isSameOrAfter(today)) {
    return 'Approaching';
  }
  return 'Overdue';
};

const getStatusOverview = (
  summary,
  t,
  quotesSubcontractors = [],
  orders = [],
  procurementSchedule = [],
  awarded = false,
) => {
  const ps = procurementSchedule.find((psItem) => psItem.id === t.id);
  const uniqueQuoteSubs = quotesSubcontractors.reduce((acc, cur) => {
    if (!acc[cur.id]) {
      acc[cur.id] = cur;
    }
    return acc;
  }, {});

  const tenderSummary = {
    interests: 0,
    quotes: {
      main: 0,
      extra: 0,
    },
    status: 0, // No status
  };
  const [startOnSite] = getProperDates2(t.start_on_site);
  // Calculate dates based on start_on_site (which is 'startOnSite' variable from getProperDates2)
  const issueOrderDate = moment(startOnSite)
    .subtract(4, 'weeks')
    .format('YYYY-MM-DD');
  const quoteDueDate = moment(startOnSite)
    .subtract(8, 'weeks')
    .format('YYYY-MM-DD');
  const issueTenderDate = moment(startOnSite)
    .subtract(12, 'weeks')
    .format('YYYY-MM-DD');

  tenderSummary.issue_order = '—';
  tenderSummary.start_on_site = startOnSite;

  if (summary && summary[t.id]) {
    tenderSummary.interests = summary[t.id].interest_count;
    tenderSummary.quotes.main = {
      main: summary[t.id].total_quote_count,
    };

    // Determine the status based on the summary and tender properties
    tenderSummary.status = '-';
    // Milestone - Issue Tender. Not started
    if (summary[t.id].enquiries_sent === 0 && !t.has_document) {
      tenderSummary.current = {
        status: 1,
        date: issueTenderDate,
        name: milestones['issue-tender'],
        risk: getRiskCategory(issueTenderDate),
      };
      tenderSummary.next = {
        status: 2,
        date: quoteDueDate,
        name: milestones['quote-due'],
        risk: getRiskCategory(quoteDueDate),
      };
      tenderSummary.status = 'Not Started';
    }
    // Milestone - Issue Tender. In progress
    if (summary[t.id].enquiries_sent === 0 && t.has_document) {
      tenderSummary.current = {
        status: 1,
        date: issueTenderDate,
        name: milestones['issue-tender'],
        risk: getRiskCategory(issueTenderDate),
      };
      tenderSummary.next = {
        status: 2,
        date: quoteDueDate,
        name: milestones['quote-due'],
        risk: getRiskCategory(quoteDueDate),
      };
      tenderSummary.status = 'In Progress';
    }
    // Milestone - Quote Due. Not started
    const enquirySent =
      summary[t.id]?.enquiries_sent > 0 && t.enquiry_sent_date;
    if (enquirySent && summary[t.id].unique_quote_count === 0) {
      tenderSummary.current = {
        status: 2,
        date: quoteDueDate,
        name: milestones['quote-due'],
        risk: getRiskCategory(quoteDueDate),
      };
      tenderSummary.next = {
        status: 3,
        date: issueOrderDate,
        name: milestones['issue-order'],
        risk: getRiskCategory(issueOrderDate),
      };
      tenderSummary.status = 'Not Started';
    }
    const psCheck =
      ps?.procurement &&
      Object.values(ps.procurement).length ===
        Object.keys(uniqueQuoteSubs).length;
    // Milestone - Quote Due. In progress
    if (enquirySent && summary[t.id]?.unique_quote_count > 0 && !psCheck) {
      tenderSummary.current = {
        status: 2,
        date: quoteDueDate,
        name: milestones['quote-due'],
        risk: getRiskCategory(quoteDueDate),
      };
      tenderSummary.next = {
        status: 3,
        date: issueOrderDate,
        name: milestones['issue-order'],
        risk: getRiskCategory(issueOrderDate),
      };
      tenderSummary.status = 'In Progress';
    }

    // Milestone - Issue Order. Not Started
    const issueOrderInit =
      enquirySent && summary[t.id]?.unique_quote_count > 0 && psCheck;
    if (issueOrderInit) {
      // and orders not matched
      tenderSummary.current = {
        status: 3,
        date: issueOrderDate,
        name: milestones['issue-order'],
        risk: getRiskCategory(issueOrderDate),
      };
      tenderSummary.next = {
        status: 4,
        date: startOnSite,
        name: milestones['start-on-site'],
        risk: getRiskCategory(startOnSite),
      };
      tenderSummary.status = 'Not Started';
    }

    const ordersCheck = orders
      .filter((o) => Number(o.tender.id) === Number(t.id))
      .flatMap((o) => o.entries)
      .filter(
        (o) =>
          (o?.status || '').toLowerCase() === 'signed' ||
          (o?.status || '').toLowerCase() === 'sent',
      );

    // Milestone - Issue Order. In Progress
    if (issueOrderInit && !ordersCheck?.length) {
      tenderSummary.current = {
        status: 3,
        date: issueOrderDate,
        name: milestones['issue-order'],
        risk: getRiskCategory(issueOrderDate),
      };
      tenderSummary.next = {
        status: 4,
        date: startOnSite,
        name: milestones['start-on-site'],
        risk: getRiskCategory(startOnSite),
      };
      tenderSummary.status = 'In Progress';
    }

    // Milestone - Start on site. Completed
    if ((issueOrderInit && ordersCheck?.length) || awarded) {
      const dateCheck =
        ordersCheck.find((o) => o.created_at)?.created_at || null;
      const valueCheck = ordersCheck.find((o) => o.value)?.value || null;
      tenderSummary.issue_order = dateCheck || '—';
      if (valueCheck != null && !isNaN(Number(valueCheck))) {
        tenderSummary.value = Number(valueCheck).toFixed(2);
      } else {
        tenderSummary.value = valueCheck;
      }

      tenderSummary.current = {
        status: 3,
        date: dateCheck || issueOrderDate || '—',
        name: milestones['order-issued'],
        risk: null,
      };
      tenderSummary.next = {
        status: 4,
        date: startOnSite,
        name: milestones['start-on-site'],
        risk: null,
      };
      tenderSummary.status = 'Completed';
    }
  }
  return tenderSummary;
};

export default getStatusOverview;
