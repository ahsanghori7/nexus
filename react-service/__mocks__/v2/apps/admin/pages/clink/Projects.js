// Mock for v2/apps/admin/pages/clink/Projects
const React = require('react');

const Projects = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'projects-page'
  }, 'Projects Page');
});

// Use both CommonJS and ESM exports to be safe
module.exports = Projects;
module.exports.default = Projects;
module.exports.__esModule = true;
