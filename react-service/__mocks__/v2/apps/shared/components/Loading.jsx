// Mock for v2/apps/shared/components/Loading
const React = require('react');

const Loading = ({ status = 'Loading...' }) => {
  return React.createElement('div', {
    'data-testid': 'loading-component',
    className: 'loading-component'
  }, status);
};

module.exports = Loading;
module.exports.default = Loading;
