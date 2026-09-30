import moment from 'moment';
import i18next from 'v2/helpers/i18n';
import isArray from 'lodash/isArray';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { CONSTANTS } from 'clink-components';

// TODO: To review this file to see if it can be improved (or at least add tests)
const {
  iconBlackAccept,
  iconBlackInterest,
  iconBlackQuote,
  iconBlackTender,
  iconBlackTrophy,
  iconWhiteAccept,
  iconWhiteInterest,
  iconWhiteQuote,
  iconWhiteTender,
  iconWhiteTrophy,
} = CONSTANTS.s3;

const { prosperBoxGreen, prosperGreenBg: greenBg } = CONSTANTS.colors.prosper;
const { red } = CONSTANTS.colors.general;

const statusEnquiries = {
  INTEREST_REGISTERED: {
    id: 1,
    index: 0,
    label: 'interested',
    icon: iconWhiteInterest,
    dark: iconBlackInterest,
    type: 'Interest',
    waiting: 'text-wait-response',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  INTEREST_ACCEPTED: {
    id: 4,
    index: 1,
    label: 'accepted',
    icon: iconWhiteAccept,
    dark: iconBlackAccept,
    type: 'Interest',
    waiting: 'text-wait-tender-docs',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  INTEREST_DECLINED: {
    id: 2,
    index: 1,
    label: 'client_declined',
    icon: WarningAmberIcon,
    dark: WarningAmberIcon,
    type: 'Interest',
    waiting: '',
    bg: red,
    color: red,
    enableAction: false,
  },
  TENDER_RECEIVED: {
    id: 1,
    index: 2,
    label: 'text-tender-received',
    icon: iconWhiteTender,
    dark: iconBlackTender,
    type: 'Enquiry',
    waiting: '',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: true,
  },
  TENDER_ACCEPTED: {
    id: 4,
    index: 2,
    label: 'text-tender-received',
    icon: iconWhiteTender,
    dark: iconBlackTender,
    type: 'Enquiry',
    waiting: 'text-send-quote',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: true,
  },
  TENDER_DECLINED: {
    id: 2,
    index: 3,
    label: 'you_declined',
    icon: WarningAmberIcon,
    dark: WarningAmberIcon,
    type: 'Enquiry',
    waiting: '',
    bg: red,
    color: red,
    enableAction: false,
  },
  QUOTE_SENT: {
    id: 9,
    index: 3,
    label: 'text-quoted',
    icon: iconWhiteQuote,
    dark: iconBlackQuote,
    type: 'Enquiry',
    waiting: 'text-wait-response',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  AWARDED: {
    id: 7,
    index: 4,
    label: 'text-package-awarded',
    icon: iconWhiteTrophy,
    dark: iconBlackTrophy,
    type: ['Enquiry', 'Order'],
    waiting: '',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  PENDING_SIGNATURE: {
    id: 12,
    index: 5,
    label: 'text-pending-signature',
    icon: iconWhiteQuote,
    dark: iconBlackQuote,
    type: 'Order',
    waiting: '',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  ORDER_SIGNED: {
    id: 13,
    index: 6,
    label: 'text-order-signed',
    icon: iconWhiteQuote,
    dark: iconBlackQuote,
    type: 'Order',
    waiting: '',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  ORDER_REJECTED: {
    id: 14,
    index: 6,
    label: 'text-order-rejected',
    icon: WarningAmberIcon,
    dark: WarningAmberIcon,
    type: 'Order',
    waiting: '',
    bg: red,
    color: red,
    enableAction: false,
  },
  IN_QUEUE: {
    id: 15,
    index: null,
    label: 'text-in-queue',
    icon: null,
    dark: null,
    type: ['Enquiry', 'Order'],
    waiting: '',
    bg: greenBg,
    color: prosperBoxGreen,
    enableAction: false,
  },
  ORDER_RETRACTED: {
    id: 7,
    index: 5,
    label: 'text-order-retracted',
    icon: WarningAmberIcon,
    dark: WarningAmberIcon,
    type: ['Enquiry', 'Order'],
    waiting: '',
    bg: red,
    color: red,
    enableAction: false,
  },
  UNSUCCESSFUL: {
    id: 0,
    index: null,
    label: 'text-unsuccessful',
    icon: WarningAmberIcon,
    dark: WarningAmberIcon,
    type: ['Interest', 'Enquiry', 'Order'],
    waiting: '',
    bg: red,
    color: red,
    enableAction: false,
  },
  OTHER_STATUS: {
    id: 0,
    index: null,
    label: '',
    icon: null,
    dark: null,
    type: [],
    waiting: '',
    bg: red,
    color: red,
    enableAction: false,
  },
  VIEWED: {
    id: 6,
    color: prosperBoxGreen,
    icon: null,
    dark: null,
    type: ['Interest', 'Enquiry', 'Order'],
  },
};

const statusProgress = [
  {
    ...statusEnquiries.INTEREST_REGISTERED,
    label: 'text-interest-registered',
    bg: greenBg,
  },
  {
    ...statusEnquiries.INTEREST_ACCEPTED,
    label: 'text-client-acceptance',
  },
  {
    ...statusEnquiries.TENDER_RECEIVED,
    label: 'text-tender-specs-received',
  },
  {
    ...statusEnquiries.QUOTE_SENT,
    label: 'text-quote-sent',
  },
  {
    ...statusEnquiries.AWARDED,
    label: 'text-package-awarded',
  },
];

const statusDeclinedProgress = {
  ...statusEnquiries.INTEREST_DECLINED,
};
const statusTenderDeclinedProgress = {
  ...statusEnquiries.TENDER_DECLINED,
};
const statusRetractedProgress = {
  ...statusEnquiries.ORDER_RETRACTED,
};
const statusSignature = [
  statusEnquiries.PENDING_SIGNATURE,
  statusEnquiries.ORDER_SIGNED,
];
const statusRejectedProgress = {
  ...statusEnquiries.ORDER_REJECTED,
};

const filterStatusByIdAndType = (data) =>
  data && data.type && data.status_id
    ? Object.keys(statusEnquiries)
        .filter(
          (key) =>
            (isArray(statusEnquiries[key].type)
              ? statusEnquiries[key].type.includes(data.type)
              : statusEnquiries[key].type === data.type) &&
            Number(statusEnquiries[key].id) === Number(data.status_id)
        )
        .map((key) => ({ ...statusEnquiries[key], status: key }))
    : [];

const getStatus = (data) => {
  const possibleStatuses = filterStatusByIdAndType(data);
  if (!possibleStatuses.length) {
    return { ...statusEnquiries.OTHER_STATUS, status: 'OTHER_STATUS' };
  }
  if (possibleStatuses.length > 1) {
    const [AWARDED, ORDER_RETRACTED] = possibleStatuses;
    return data.awarded && data.order_created && !data.awarded_externally
      ? AWARDED
      : ORDER_RETRACTED;
  }
  const [selectedStatus] = possibleStatuses;
  if (
    selectedStatus &&
    (selectedStatus.status === 'INTEREST_DECLINED' ||
      selectedStatus.status === 'TENDER_DECLINED')
  ) {
    return selectedStatus;
  }

  if (
    data &&
    (data.awarded_externally ||
      Number(data.status_id) === statusEnquiries.VIEWED.id)
  ) {
    return {
      ...statusEnquiries.UNSUCCESSFUL,
      status: 'UNSUCCESSFUL',
      index: selectedStatus.index + 1,
    };
  }

  if (selectedStatus.status === 'PENDING_SIGNATURE') {
    const total = data && data.signatory ? data.signatory.total : 0;
    const signed = data && data.signatory ? data.signatory.signers : 0;
    const labelCount = total ? ` (${signed}/${total})` : '';
    return {
      ...selectedStatus,
      label: `${i18next.t(selectedStatus.label)}${labelCount}`,
    };
  }

  return selectedStatus;
};

const getProgress = (statusData) => {
  switch (statusData.status) {
    case 'INTEREST_REGISTERED':
      return statusProgress;
    case 'INTEREST_ACCEPTED':
      return statusProgress;
    case 'INTEREST_DECLINED':
      return statusProgress.map((s) =>
        Number(s.index) === statusDeclinedProgress.index
          ? statusDeclinedProgress
          : s
      );
    case 'TENDER_RECEIVED':
      return statusProgress;
    case 'TENDER_ACCEPTED':
      return statusProgress;
    case 'TENDER_DECLINED':
      return statusProgress.map((s) =>
        Number(s.index) === statusTenderDeclinedProgress.index
          ? statusTenderDeclinedProgress
          : s
      );
    case 'QUOTE_SENT':
      return statusProgress;
    case 'AWARDED':
      return statusProgress;
    case 'ORDER_RETRACTED':
      return [...statusProgress, statusRetractedProgress];
    case 'PENDING_SIGNATURE':
    case 'ORDER_SIGNED':
      return [...statusProgress, ...statusSignature];
    case 'ORDER_REJECTED':
      return [...statusProgress, statusSignature[0], statusRejectedProgress];
    case 'UNSUCCESSFUL':
      return statusProgress.map((s) =>
        Number(s.index) === statusData.index ? statusData : s
      );
    default:
      return statusProgress;
  }
};

const getDaysToShow = (data) => {
  let reference = null;
  const statusData = getStatus(data);
  switch (statusData.status) {
    case 'TENDER_ACCEPTED':
      reference = data.tenderReturn || data.tender_return;
      break;
    case 'INTEREST_ACCEPTED':
    case 'TENDER_RECEIVED':
      reference = data.start || data.send_date;
      break;
    case 'QUOTE_SENT':
      reference = data.decisionDate || data.decision_date;
      break;
    case 'AWARDED':
      reference = data.startOnSite || data.start_on_site;
      break;
    default:
      break;
  }

  if (!reference) {
    return reference;
  }

  const today = moment().startOf('day');
  const days = Math.round(
    moment.duration(today - moment(new Date(reference))).asDays()
  );
  return days < 0 ? -days : 0;
};

export { getStatus, getDaysToShow, getProgress, statusEnquiries };
