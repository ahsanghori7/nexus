import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import isObject from 'lodash/isObject';

import moment from 'moment';
import { DIFF_TYPE_DAY, DIFF_TYPE_WEEK, DIFF_TYPE_MONTH } from './constants';

const getTypeLabel = (type) => {
  let newLabel;
  switch (type.toLowerCase()) {
    case 'text/plain':
    case 'txt':
      newLabel = 'Text';
      break;
    case 'application/pdf':
    case 'pdf':
      newLabel = 'PDF';
      break;
    case 'image/vnd.dxf':
    case 'image/vnd.dwg':
    case 'dxf':
    case 'dwg':
      newLabel = 'CAD';
      break;
    case 'application/vnd.oasis.opendocument.text':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
    case 'application/msword':
    case 'odt':
    case 'docx':
    case 'doc':
    case 'dotx':
      newLabel = 'Word';
      break;
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.template':
    case 'xls':
    case 'xlsx':
    case 'xlt':
    case 'xltx':
      newLabel = 'Excel';
      break;
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
    case 'jpg':
    case 'png':
    case 'gif':
      newLabel = 'Image';
      break;
    case 'application/vnd.oasis.opendocument.presentation':
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.slideshow':
    case 'application/vnd.openxmlformats-officedocument.presentationml.template':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'odp':
    case 'pot':
    case 'pps':
    case 'ppsx':
    case 'potx':
      newLabel = 'PowerPoint';
      break;
    case 'msg':
    case 'eml':
      newLabel = 'Outlook';
      break;
    default:
      newLabel = type;
  }
  return newLabel;
};

const existsUndefinedParams = (...params) => {
  return Boolean(params.filter((param) => isNil(param)).length);
};

const sortSizeServices = (sizes) => {
  if (isNil(sizes) || !isArray(sizes)) {
    return null;
  }

  if (isEmpty(sizes)) {
    return [];
  }

  const [ToBeConfirmed, upToFiveK, overOneM, ...restSizes] = sizes.reverse();

  return [
    ToBeConfirmed,
    upToFiveK,
    ...restSizes.sort((sizeA, sizeB) =>
      sizeA.sortKey.localeCompare(sizeB.sortKey, 'en', {
        numeric: true,
        sensitivity: 'base',
      })
    ),
    overOneM,
  ].map((size) => ({
    id: Number(size.id),
    value: Number(size.id),
    label: size.label,
  }));
};

const getSortedSizeServices = (sizes) => {
  if (isNil(sizes) || !isObject(sizes) || isArray(sizes)) {
    return null;
  }

  const arraySizes = Object.keys(sizes).map((id) => {
    return {
      id,
      label: sizes[id],
      sortKey: sizes[id]
        .replace('Packages', '')
        .replace(/£/g, '')
        .replace(/$/g, '')
        .replace(/€/g, '')
        .trim(),
    };
  });

  return sortSizeServices(arraySizes);
};

const getTextFromHTML = (html) => {
  const divContainer = document.createElement('div');
  divContainer.innerHTML = html;
  return divContainer.textContent || divContainer.innerText || '';
};

const getTextFromJson = (json) => {
  const noBreaks = json.replaceAll('{br}', ' ');
  let noCodes = noBreaks.replaceAll('{b:', '');
  noCodes = noCodes.replaceAll('{em:', '');
  noCodes = noCodes.replaceAll('{u:', '');
  noCodes = noCodes.replaceAll('{del:', '');
  noCodes = noCodes.replaceAll('{red:', '');
  noCodes = noCodes.replaceAll('{mark:', '');
  noCodes = noCodes.replaceAll('{ul:', '');
  noCodes = noCodes.replaceAll('{li:', '');
  noCodes = noCodes.replaceAll('{lind:', '');
  noCodes = noCodes.replaceAll('{lnd2:', '');
  noCodes = noCodes.replaceAll('{lnd3:', '');
  noCodes = noCodes.replaceAll('{lnd4:', '');
  noCodes = noCodes.replaceAll('{lnd5:', '');
  noCodes = noCodes.replaceAll('{lnd6:', '');
  noCodes = noCodes.replaceAll('{lnd7:', '');
  noCodes = noCodes.replaceAll('{lnd8:', '');
  noCodes = noCodes.replaceAll('{hr}', '');
  noCodes = noCodes.replaceAll('{hrt}', '');
  noCodes = noCodes.replaceAll('{bpnk:', '');
  noCodes = noCodes.replaceAll('{binv:', '');
  noCodes = noCodes.replaceAll('{inv:', '');
  noCodes = noCodes.replaceAll('{gp:', '');
  noCodes = noCodes.replaceAll('{ol:', '');
  return noCodes.replaceAll('}', '');
};

const dateSubstract = (date1, date2, format = DIFF_TYPE_WEEK) => {
  if (![DIFF_TYPE_DAY, DIFF_TYPE_WEEK, DIFF_TYPE_MONTH].includes(format)) {
    return '';
  }

  const firstDate =
    typeof date1 === 'string' ? moment(date1, 'DD/MM/YYYY') : moment(date1);
  const secondDate =
    typeof date2 === 'string' ? moment(date2, 'DD/MM/YYYY') : moment(date2);

  if (!moment.isMoment(firstDate) || !moment.isMoment(secondDate)) {
    return '';
  }

  const diff = moment(secondDate)
    .startOf('day')
    .diff(moment(firstDate).startOf('day'), format, true)
    .toFixed(2);

  if (isNaN(diff)) {
    return '';
  }

  return Number(diff) === 1 ? `${diff} ${format}` : `${diff} ${format}s`;
};

export {
  getTypeLabel,
  existsUndefinedParams,
  getSortedSizeServices,
  getTextFromHTML,
  getTextFromJson,
  dateSubstract,
};
