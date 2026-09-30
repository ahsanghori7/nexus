// Mock for v2/apps/admin/pages/prosper/Accounts
const React = require('react');

const AccountsProsper = React.forwardRef((props, ref) => {
  const { customTypeAccount, ...otherProps } = props;
  return React.createElement('div', {
    ...otherProps,
    ref,
    'data-testid': 'accounts-prosper-page',
    'data-custom-type': customTypeAccount
  }, `Accounts Prosper Page (type: ${customTypeAccount || 'default'})`);
});

// Use both CommonJS and ESM exports to be safe
module.exports = AccountsProsper;
module.exports.default = AccountsProsper;
module.exports.__esModule = true;
