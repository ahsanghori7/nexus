import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { getDateValues, isValidDate } from 'v2/helpers/date';

TimeAgo.addDefaultLocale(en);

export const getTimeAgo = (date) => {
  if (typeof date !== 'string' && !(date instanceof Date)) {
    return null;
  }
  const timeAgo = new TimeAgo('en-GB');
  if (typeof date === 'string') {
    if (isValidDate(getDateValues(date))) {
      return timeAgo.format(getDateValues(date), 'round-minute');
    }
    return null;
  }
  return timeAgo.format(date, 'round-minute');
};
