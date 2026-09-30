// __mocks__/@mui/icons-material/AutoAwesome.jsx
import * as React from 'react';
const AutoAwesomeIcon = React.forwardRef((props, ref) => {
    return React.createElement('div', {
        'data-testid': 'auto-awesome-icon',
        ...props,
        ref,
    });
});
AutoAwesomeIcon.displayName = 'AutoAwesomeIcon';
module.exports = AutoAwesomeIcon;
