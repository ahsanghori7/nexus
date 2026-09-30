// Mock for v2/apps/admin/pages/clink/Accounts
const React = require('react');

const Accounts = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'accounts-page'
  }, 'Accounts Page');
});

// Use both CommonJS and ESM exports to be safe
module.exports = Accounts;
module.exports.default = Accounts;
module.exports.__esModule = true;
