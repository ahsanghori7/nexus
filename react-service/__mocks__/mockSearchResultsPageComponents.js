// Mock components for SearchResults page dependencies
const React = require('react');

// Mock Contractors component
const Contractors = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'contractors-page'
  }, 'Contractors Page');
});

// Mock Projects component
const Projects = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'projects-page'
  }, 'Projects Page');
});

// Mock Accounts component
const Accounts = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'accounts-page'
  }, 'Accounts Page');
});

// Mock AccountsProsper component
const AccountsProsper = React.forwardRef((props, ref) => {
  const { customTypeAccount, ...otherProps } = props;
  return React.createElement('div', {
    ...otherProps,
    ref,
    'data-testid': 'accounts-prosper-page',
    'data-custom-type': customTypeAccount
  }, `Accounts Prosper Page (type: ${customTypeAccount || 'default'})`);
});

// Default export should match the component being imported
module.exports = Projects; // Default export for Projects
module.exports.Contractors = Contractors;
module.exports.Projects = Projects;
module.exports.Accounts = Accounts;
module.exports.AccountsProsper = AccountsProsper;
module.exports.__esModule = true;
