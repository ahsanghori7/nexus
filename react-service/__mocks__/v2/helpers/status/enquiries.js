// __mocks__/v2/helpers/status/enquiries.js

// Mock the icons that the real module is trying to import
const iconBlackAccept = 'mock-icon-accept';
const iconBlackInterest = 'mock-icon-interest';
const iconBlackQuote = 'mock-icon-quote';
const iconBlackTender = 'mock-icon-tender';
// Add any other icons that might be used

// Mock the statusEnquiries object that's imported in the tests
const statusEnquiries = {
  OTHER_STATUS: {
    label: 'other-status',
    type: 'Other',
    status_id: 0,
    dark: null,
    bg: '#f5f5f5',
    color: '#666',
    icon: 'mock-icon'
  },
  INTEREST_REGISTERED: {
    label: 'interested',
    type: 'Interest',
    status_id: 1,
    dark: iconBlackInterest,
    bg: '#e3f2fd',
    color: '#1976d2',
    icon: iconBlackInterest
  },
  TENDER_ACCEPTED: {
    label: 'text-tender-specs-received',
    type: 'Enquiry',
    status_id: 4,
    dark: iconBlackTender,
    bg: '#fff3e0',
    color: '#f57c00',
    icon: iconBlackTender,
    waiting: 'waiting'
  },
  TENDER_DECLINED: {
    label: 'you_declined',
    type: 'Enquiry',
    status_id: 5,
    icon: iconBlackTender,
    color: 'error'
  },
  QUOTE_SENT: {
    label: 'quote-sent',
    type: 'Enquiry',
    status_id: 9,
    dark: iconBlackQuote,
    bg: '#e8f5e8',
    color: '#2e7d32',
    icon: iconBlackQuote
  },
  UNSUCCESSFUL: {
    label: 'unsuccessful',
    type: 'Enquiry',
    status_id: 1,
    icon: 'mock-icon-unsuccessful',
    color: 'error'
  },
  AWARDED: {
    label: 'awarded',
    type: ['Enquiry', 'Order'],
    status_id: 7,
    icon: iconBlackAccept,
    color: 'success'
  },
  ORDER_REJECTED: {
    label: 'text-order-rejected',
    type: 'Order',
    status_id: 11,
    icon: 'mock-icon-rejected',
    color: 'error'
  },
  ORDER_SIGNED: {
    label: 'text-order-signed',
    type: 'Order',
    status_id: 13,
    icon: 'mock-icon-signed',
    color: 'success'
  },
  ORDER_RETRACTED: {
    label: 'order-retracted',
    type: 'Order',
    status_id: 7,
    icon: 'mock-icon-retracted',
    color: 'error'
  },
  INTEREST_ACCEPTED: {
    label: 'interest-accepted',
    type: 'Interest',
    status_id: 4,
    icon: iconBlackInterest,
    color: 'success'
  },
  INTEREST_DECLINED: {
    label: 'client_declined',
    type: 'Interest',
    status_id: 5,
    icon: 'mock-icon-declined',
    color: 'error'
  },
  PENDING_SIGNATURE: {
    label: 'text-pending-signature',
    type: 'Order',
    status_id: 12,
    icon: 'mock-icon-pending',
    color: 'warning'
  }
};

// Mock the functions that are imported in the tests
const getStatus = (data) => {
  if (!data) {
    return { ...statusEnquiries.OTHER_STATUS, status: 'OTHER_STATUS' };
  }

  const { type, status_id, awarded, order_created, awarded_externally, signatory } = data;

  // Handle UNSUCCESSFUL case
  if (type === 'Enquiry' && status_id === 1 && awarded_externally) {
    return { ...statusEnquiries.UNSUCCESSFUL, status: 'UNSUCCESSFUL' };
  }

  // Handle INTEREST_REGISTERED
  if (type === 'Interest' && status_id === 1) {
    return { ...statusEnquiries.INTEREST_REGISTERED, status: 'INTEREST_REGISTERED' };
  }

  // Handle AWARDED vs ORDER_RETRACTED
  if (type === 'Order' && status_id === 7) {
    if (awarded && order_created) {
      return { ...statusEnquiries.AWARDED, status: 'AWARDED' };
    } else if (order_created && !awarded) {
      return { ...statusEnquiries.ORDER_RETRACTED, status: 'ORDER_RETRACTED' };
    }
  }

  // Handle PENDING_SIGNATURE with signatory counts
  if (type === 'Order' && status_id === 12 && signatory) {
    const statusObj = { ...statusEnquiries.PENDING_SIGNATURE, status: 'PENDING_SIGNATURE' };
    statusObj.label = `${statusObj.label} (${signatory.signers}/${signatory.total})`;
    return statusObj;
  }

  // Handle TENDER_ACCEPTED
  if (type === 'Enquiry' && status_id === 4) {
    return { ...statusEnquiries.TENDER_ACCEPTED, status: 'TENDER_ACCEPTED' };
  }

  // Handle QUOTE_SENT
  if (type === 'Enquiry' && status_id === 9) {
    return { ...statusEnquiries.QUOTE_SENT, status: 'QUOTE_SENT' };
  }

  // Handle INTEREST_ACCEPTED
  if (type === 'Interest' && status_id === 4) {
    return { ...statusEnquiries.INTEREST_ACCEPTED, status: 'INTEREST_ACCEPTED' };
  }

  // Default case
  return { ...statusEnquiries.OTHER_STATUS, status: 'OTHER_STATUS' };
};

const getDaysToShow = (data) => {
  if (!data) return null;

  const { type, status_id } = data;

  // Simple mock that returns a fixed number for testing
  // Handle TENDER_ACCEPTED
  if (type === 'Enquiry' && status_id === 4) {
    const tenderDate = data.tenderReturn || data.tender_return;
    if (tenderDate) {
      // Simple mock: return 5 days if date exists
      return 5;
    }
  }

  // Handle INTEREST_ACCEPTED
  if (type === 'Interest' && status_id === 4) {
    const startDate = data.start || data.send_date;
    if (startDate) {
      // Simple mock: return 3 days if date exists
      return 3;
    }
  }

  // Handle QUOTE_SENT
  if (type === 'Enquiry' && status_id === 9) {
    const decisionDate = data.decisionDate || data.decision_date;
    if (decisionDate) {
      // Simple mock: return 2 days if date exists
      return 2;
    }
  }

  return null;
};

const getProgress = (statusData) => {
  const { status } = statusData;

  // Basic mapping for test cases
  const progressMap = {
    'INTEREST_REGISTERED': [
      { label: 'text-interest-registered', completed: true }
    ],
    'INTEREST_DECLINED': [
      { label: 'text-interest-registered', completed: true },
      { label: 'client_declined', completed: true }
    ],
    'TENDER_ACCEPTED': [
      { label: 'text-tender-specs-received', completed: true }
    ],
    'TENDER_DECLINED': [
      { label: 'text-tender-specs-received', completed: true },
      { label: 'you_declined', completed: true }
    ],
    'ORDER_SIGNED': [
      { label: 'text-pending-signature', completed: true },
      { label: 'text-order-signed', completed: true }
    ],
    'ORDER_REJECTED': [
      { label: 'text-order-rejected', completed: true }
    ]
  };

  return progressMap[status] || [];
};

// Export all mocked functions and objects
module.exports = {
  // Export the icons
  iconBlackAccept,
  iconBlackInterest,
  iconBlackQuote,
  iconBlackTender,

  // Export the functions and objects used in tests
  getStatus,
  getDaysToShow,
  getProgress,
  statusEnquiries
};
