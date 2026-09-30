// Mock for features tabs
const React = require('react');

const mockFeaturesTabs = (contextType, featureList) => {
  return [
    {
      id: 0,
      label: 'envelopes',
      content: React.createElement('div', { 'data-testid': 'features-envelopes-tab' },
        `Envelopes tab for context: ${contextType}, Features: ${JSON.stringify(featureList)}`
      ),
    },
  ];
};

module.exports = mockFeaturesTabs;
