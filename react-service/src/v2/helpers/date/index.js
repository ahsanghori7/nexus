import moment from 'moment';
import isString from 'lodash/isString';
import isNull from 'lodash/isNull';

const LONDON_TIMEZONE_PROPS = {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
};

const LOCALE_MAP = {
  UK: 'en-GB',
  NZ: 'en-NZ',
  AUS: 'en-AU',
};

const DEFAULT_DATE_FORMAT = 'Do MMMM YYYY';

function isValidDate(d) {
  return !isNaN(d) && d instanceof Date;
}

const getDateValuesString = (value) => {
  const isSafari = window.safari !== undefined;
  if (!value) {
    return value;
  }
  if (isSafari) {
    return value.replace(/-/g, '/');
  }
  return value;
};

const getDateValues = (value) => {
  if (value) {
    const date = new Date(getDateValuesString(value));
    if (isValidDate(date)) {
      return date;
    }
  }
  return null;
};

const getLondonUTCDate = (date) => {
  let newDate = new Date();
  if (date && typeof date === 'string') {
    newDate = new Date(date);
  }

  const fullDateUTC = newDate
    .toLocaleString('en-GB', LONDON_TIMEZONE_PROPS)
    .replace(',', '')
    .replace('AM', '')
    .replace('PM', '')
    .trim();

  const [dateUTC, timeUTC] = fullDateUTC.split(' ');
  const [dayUTC, monthUTC, yearUTC] = dateUTC.split('/');

  return `${yearUTC}-${monthUTC}-${dayUTC} ${timeUTC}`;
};

const happenInLast24Hours = (millisecondsDate) => {
  const currentDate = Date.now();
  const difference = currentDate - millisecondsDate;
  const millisecondsInOneHour = 24 * 60 * 60 * 1000;
  return difference <= millisecondsInOneHour;
};

const expiredDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
};

const getStringDate = (date, formatDate = 'YYYY-MM-DD') =>
  isString(date) ? date : moment(date).format(formatDate);

const getProperDates = (start_on_site, tender_return) => {
  const startOnSite = getDateValues(
    start_on_site ? start_on_site.split('-').reverse().join('-') : start_on_site
  );
  const tenderReturn = getDateValues(
    tender_return ? tender_return.split('-').reverse().join('-') : tender_return
  );
  return [startOnSite, tenderReturn];
};

const getProperDates2 = (start_on_site, tender_return) => {
  const startOnSite =
    start_on_site ? start_on_site.split('-').reverse().join('-') : start_on_site
  ;
  const tenderReturn =
    tender_return ? tender_return.split('-').reverse().join('-') : tender_return
  ;
  return [startOnSite, tenderReturn];
};

const processTenderDates = (tenders, formatDate) =>
  tenders.map((i) => {
    const [startOnSite, tenderReturn] = getProperDates(
      i.start_on_site,
      i.tender_return
    );
    const end = startOnSite;
    // this has correct YYYY-MM-DD format
    let sentDate = getDateValues(
      i.send_date ??
        moment(tenderReturn).subtract(2, 'weeks').format(formatDate)
    );
    if (sentDate > tenderReturn || sentDate > startOnSite) {
      sentDate = getDateValues(
        moment(tenderReturn).subtract(2, 'weeks').format(formatDate)
      );
    }

    // actual sent date exist
    if (i.enquiry_sent_date) {
      sentDate = getDateValues(i.enquiry_sent_date);
    }

    let decisionDate = null;
    if (i.decision_date) {
      decisionDate = getDateValues(i.decision_date);
    }

    let subcontractWorkFinish = null;
    if (i.subcontract_work_finish) {
      subcontractWorkFinish = getDateValues(i.subcontract_work_finish);
    }

    const result = {
      ...i,
      start: getStringDate(sentDate),
      end: getStringDate(end),
      tenderReturn: getStringDate(tenderReturn),
      startOnSite: getStringDate(startOnSite),
      decisionDate: getStringDate(decisionDate),
      ...(subcontractWorkFinish && {
        end: getStringDate(subcontractWorkFinish),
        beforeEnd: getStringDate(startOnSite),
        subcontractWorkFinish: getStringDate(subcontractWorkFinish),
      }),
    };

    return result;
  });

function isIOS() {
  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    return true;
  }
  return (
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 2 &&
    /MacIntel/.test(navigator.platform)
  );
}

function isIpadOS() {
  return (
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 2 &&
    /MacIntel/.test(navigator.platform)
  );
}

const getDateValuesV1 = (value, acceptNullValue = false) => {
  if (acceptNullValue && isNull(value)) {
    return value;
  }

  let newValue = '';
  if (!value) {
    return newValue;
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('en-UK');
  }
  if (moment(value, 'DD/MM/YYYY').format('DD/MM/YYYY') !== 'Invalid date') {
    return new Date(moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'));
  }
  if (typeof value === 'string' && isNaN(Date.parse(value))) {
    return value;
  }
  if (isNaN(Date.parse(value))) {
    return value;
  }
  const isSafari = window.safari !== undefined || isIpadOS() || isIOS();
  if (isSafari) {
    newValue = (value && new Date(value)) || '';
  } else {
    // Date format required: YYYY-MM-DD
    // We usually get from backend value format = DD-MM-YYYY, so we reverse it
    // In case we get the desired format that we require, there's no need to reverse
    let arrayDate = value.split('-');
    const [firstValue] = arrayDate;
    // if first value from array is minor that 100, it's not the year
    if (firstValue < 100) {
      arrayDate = arrayDate.reverse();
    }
    newValue = (value && new Date(arrayDate)) || '';
  }
  return newValue;
};

function getDiffDays(date1, date2 = null) {
  const date1Moment = moment(date1).startOf('day');
  const date1Moment2 = (date2 ? moment(date2) : moment()).startOf('day');
  return date1Moment.diff(date1Moment2, 'days');
}

function formatUKorAnzDateTime(isoDate, countryCode = 'UK') {
  if (!isoDate || isNaN(new Date(isoDate).getTime())) {
    return { date: 'N/A', time: 'N/A' };
  }
  const date = new Date(isoDate);
  const locale = LOCALE_MAP[countryCode] || 'en-GB';
  const formattedDate = date.toLocaleDateString(locale);
  const formattedTime = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    date: formattedDate,
    time: formattedTime,
  };
}

export {
  LONDON_TIMEZONE_PROPS,
  isValidDate,
  getDateValuesString,
  getDateValues,
  getLondonUTCDate,
  getProperDates,
  happenInLast24Hours,
  expiredDate,
  getStringDate,
  processTenderDates,
  DEFAULT_DATE_FORMAT,
  isIOS,
  isIpadOS,
  getDateValuesV1,
  getDiffDays,
  getProperDates2,
  formatUKorAnzDateTime
};
