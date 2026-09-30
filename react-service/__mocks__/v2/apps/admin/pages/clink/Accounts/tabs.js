// Mock for clink accounts tabs
const React = require('react');

const mockClinkTabs = (contextType, totalEnquiries = 0, totalQuotes = 0) => {
  return [
    {
      id: 0,
      label: 'engagement',
      content: React.createElement('div', { 'data-testid': 'clink-engagement-tab' },
        `Enquiries: ${totalEnquiries}, Quotes: ${totalQuotes}, Context: ${contextType}`
      ),
    },
    {
      id: 1,
      label: 'activity',
      content: React.createElement('div', { 'data-testid': 'clink-activity-tab' },
        `Activity tab for context: ${contextType}`
      ),
    },
  ];
};

module.exports = mockClinkTabs;
