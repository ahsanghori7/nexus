const React = require('react');

const Avatar = ({ children, alt, src, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'mui-avatar',
    alt,
    src,
    ...props,
  }, children);
};

Avatar.displayName = 'Avatar';

module.exports = Avatar;
