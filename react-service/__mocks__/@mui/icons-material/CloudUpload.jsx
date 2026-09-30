// __mocks__/@mui/icons-material/CloudUpload.js
import * as React from 'react';

const CloudUpload = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'cloud-upload-icon',
    ...props,
    ref,
  });
});
CloudUpload.displayName = 'CloudUpload';
module.exports = CloudUpload;
