// Mock for prosper accounts tabs
const React = require('react');

const mockProsperTabs = (contextType, uid) => {
  return [
    {
      id: 0,
      label: 'profile-information',
      content: React.createElement('div', { 'data-testid': 'prosper-profile-tab' },
        `Profile tab for context: ${contextType}, UID: ${uid}`
      ),
    },
    {
      id: 1,
      label: 'prequalification-information',
      content: React.createElement('div', { 'data-testid': 'prosper-prequalification-tab' },
        `Prequalification tab for context: ${contextType}`
      ),
    },
    {
      id: 2,
      label: 'activity',
      content: React.createElement('div', { 'data-testid': 'prosper-activity-tab' },
        `Activity tab for context: ${contextType}`
      ),
    },
  ];
};

module.exports = mockProsperTabs;
