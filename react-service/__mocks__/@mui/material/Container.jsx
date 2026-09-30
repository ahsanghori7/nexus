const React = require('react');

const Container = ({ children, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'mock-container',
    ...props,
  }, children);
};

Container.displayName = 'Container';

module.exports = Container;
