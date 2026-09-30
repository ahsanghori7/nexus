/* eslint-disable no-unused-vars */
import moment from 'moment';
import sortBy from 'lodash/sortBy';
import min from 'lodash/min';
import { HELPERS, CONSTANTS } from 'clink-components';
import {
  getDateValues,
  getDiffDays,
  getProperDates,
  getProperDates2,
} from 'v2/helpers/date';
import getStatusOverview from './getStatusOverview';

const { colorGenerator } = HELPERS;

const {
  iconRoundAwardedLigthgreen,
  iconRoundEditLigthgreen,
  iconRoundOnsiteLigthgreen,
  iconRoundQuotedLigthgreen,
  iconRoundTenderLigthgreen,
} = CONSTANTS.s3;

const showWarning = (tender, summary) => {
  const { start, middle, end, quotes } = tender;
  const { status } = summary;
  if (status <= 2 && getDiffDays(start) <= 5) {
    return 2;
  }
  if (status === 3 && quotes && !quotes.main && getDiffDays(middle) <= 5) {
    return 3;
  }
  if (status === 4 && getDiffDays(end) <= 10) {
    return 4;
  }
  return false;
};

const getStatus = (summary, t) => {
  let tenderSummary = {
    interests: 0,
    quotes: {
      main: 0,
      extra: 0,
    },
    status: 0, // No status
  };
  if (summary && summary[t.id]) {
    tenderSummary = {
      interests: summary[t.id].interest_count,
      quotes: {
        main: summary[t.id].total_quote_count,
      },
    };
    if (summary[t.id].enquiries_sent === 0 && !t.has_document) {
      tenderSummary.status = 1;
    }
    if (summary[t.id].enquiries_sent === 0 && t.has_document) {
      tenderSummary.status = 2;
    }
    if (summary[t.id].enquiries_sent > 0 && t.enquiry_sent_date) {
      tenderSummary.status = 3;
    }
    if (summary[t.id].unique_quote_count > 0) {
      tenderSummary.status = 4;
    }
    if (t.awarded) {
      tenderSummary.status = 5;
    }
  }
  return tenderSummary;
};

const initTasks = (tenders, summary, dependency) => {
  let showAlert = false;
  let filteredTenders = [];
  if (tenders?.length) {
    // check is tender is in draft or published state
    filteredTenders = tenders.filter(
      (t) => Number(t.state) === 1 || Number(t.state) === 2,
    );
    // check if tender return & tender start on site dates are set
    filteredTenders = filteredTenders.filter((t) => {
      const isCorrectRange = t.start_on_site && t.tender_return;
      if (!showAlert && !isCorrectRange) {
        showAlert = true;
      }
      return isCorrectRange;
    });
    // check if start on site date is before tender return date, then show alert
    filteredTenders = filteredTenders.filter((t) => {
      const [startOnSite, tenderReturn] = getProperDates(
        t.start_on_site,
        t.tender_return,
      );
      const isCorrectRange = startOnSite > tenderReturn;
      if (!showAlert && !isCorrectRange) {
        showAlert = true;
      }
      return isCorrectRange;
    });
    // check if enquiry sent date is before tender return date, then show alert
    filteredTenders = filteredTenders.filter((t) => {
      if (t.enquiry_sent_date) {
        const [_, tenderReturn] = getProperDates(
          t.enquiry_sent_date,
          t.tender_return,
        );
        const enquirySentDate = getDateValues(t.enquiry_sent_date);
        const isCorrectRange = tenderReturn > enquirySentDate;
        if (!showAlert && !isCorrectRange) {
          showAlert = true;
        }
        return isCorrectRange;
      }
      return true;
    });
    // check if subcontract work finish date is before start on site date, then show alert
    filteredTenders = filteredTenders.filter((t) => {
      if (t.subcontract_work_finish) {
        const [_, startOnSite] = getProperDates2(
          t.subcontract_work_finish,
          t.start_on_site,
        );
        const subcontractWorkFinish = getDateValues(t.subcontract_work_finish);
        const isCorrectRange =
          subcontractWorkFinish > getDateValues(startOnSite);
        if (!showAlert && !isCorrectRange) {
          showAlert = true;
        }
        return isCorrectRange;
      }
      return true;
    });
  }

  filteredTenders = filteredTenders.map((t, i) => {
    const color = colorGenerator(t.label);
    const [startOnSite, tenderReturn] = getProperDates2(
      t.start_on_site,
      t.tender_return,
    );
    let end = startOnSite;
    // this has correct YYYY-MM-DD format
    let sentDate =
      t.send_date ??
      moment(tenderReturn).subtract(2, 'weeks').format('YYYY-MM-DD');
    if (
      getDateValues(sentDate) > getDateValues(tenderReturn) ||
      getDateValues(sentDate) > getDateValues(startOnSite)
    ) {
      sentDate = moment(tenderReturn).subtract(2, 'weeks').format('YYYY-MM-DD');
    }
    // actual sent date exist
    let enquirySentDate = false;
    if (t.enquiry_sent_date) {
      sentDate = t.enquiry_sent_date;
      enquirySentDate = true;
    }

    // new dates
    let decisionDate = null;
    if (t.decision_date) {
      decisionDate = t.decision_date;
    }
    let subcontractWorkFinish = null;
    if (t.subcontract_work_finish) {
      subcontractWorkFinish = t.subcontract_work_finish;
    }

    const tenderSummary = getStatus(summary, t);

    let dependencies = [];
    const dependencyDateObject = {};
    if (dependency[filteredTenders[i].id]) {
      dependencies = dependency[filteredTenders[i].id].map((dep) => {
        if (!dependencyDateObject[filteredTenders[i].id]) {
          dependencyDateObject[filteredTenders[i].id] = [
            {
              ...dep,
            },
          ];
        } else {
          dependencyDateObject[filteredTenders[i].id].push({
            ...dep,
          });
        }

        return dep.tender_parent_id;
      });
      dependencies = dependencies.sort();
      if (dependencyDateObject[filteredTenders[i].id]) {
        dependencyDateObject[filteredTenders[i].id] = sortBy(
          dependencyDateObject[filteredTenders[i].id],
          ['tender_parent_id'],
        );
      }
    }

    const result = {
      ...t,
      name: t.label,
      start: sentDate,
      tenderReturn,
      startOnSite,
      color,
      progress: 0,
      type: 'task',
      project: 'ProjectSample',
      ...(t.state &&
        tenderSummary.status && {
          styles: {
            backgroundColor: color,
            backgroundSelectedColor: color,
          },
        }),
      ...tenderSummary,
      dependencies,
      dependencyDateObject,
      enquirySentDate,
    };
    if (decisionDate) {
      result.decisionDate = decisionDate;
    }
    if (subcontractWorkFinish) {
      end = subcontractWorkFinish;
      result.beforeEnd = startOnSite;
      result.subcontractWorkFinish = subcontractWorkFinish;
    }
    result.end = end;
    return {
      ...result,
      warning: showWarning(result, tenderSummary),
    };
  });
  filteredTenders = sortBy(filteredTenders, ['startOnSite']) || [];
  filteredTenders = filteredTenders.map((t, i) => ({
    ...t,
    displayOrder: i + 1,
  }));
  return [filteredTenders, showAlert];
};

const statuses = [
  { id: 1, label: 'no tender doc', icon: iconRoundOnsiteLigthgreen },
  { id: 2, label: 'tender ready', icon: iconRoundEditLigthgreen },
  { id: 3, label: 'sent', icon: iconRoundTenderLigthgreen },
  { id: 4, label: 'quoted', icon: iconRoundQuotedLigthgreen },
  { id: 5, label: 'awarded', icon: iconRoundAwardedLigthgreen },
];

const getBudgetSummary = (quotesData) => {
  let budget = 0;
  const filteredListOfQuotes = Object.values(quotesData?.tenders || {}).filter(
    (tender) => tender?.label,
  );
  filteredListOfQuotes.forEach((tender) => {
    const { budget: tenderBudget } = tender;
    budget += tenderBudget;
  });

  return { budget, forecast: 0, profit_loss: 0 };
};

export {
  initTasks,
  showWarning,
  statuses,
  getStatus,
  getStatusOverview,
  getBudgetSummary,
};
