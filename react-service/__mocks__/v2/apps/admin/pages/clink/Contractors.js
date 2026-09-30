// Mock for v2/apps/admin/pages/clink/Contractors
const React = require('react');

const Contractors = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'contractors-page'
  }, 'Contractors Page');
});

// Use both CommonJS and ESM exports to be safe
module.exports = Contractors;
module.exports.default = Contractors;
module.exports.__esModule = true;
