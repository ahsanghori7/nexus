// __mocks__/@mui/material/Alert.js
import * as React from 'react';

const Alert = React.forwardRef((props, ref) => {
  const { severity = 'success', variant = 'standard', action, ...rest } = props;

  // If action is provided as an object, process it
  let actionElement = null;
  if (action) {
    if (typeof action === 'object' && !React.isValidElement(action)) {
      // Create a close button if the action object is for a close icon
      if (action.icon) {
        actionElement = (
          <button
            aria-label="close"
            className="MuiIconButton-root"
            type="button"
            onClick={action.onClick}
          >
            {action.icon}
          </button>
        );
      }
    } else {
      // If it's a React element, use it directly
      actionElement = action;
    }
  }

  return React.createElement('div', {
    role: 'alert', // Add the alert role for accessibility and testing
    className: `MuiAlert-root MuiAlert-${variant}${severity.charAt(0).toUpperCase() + severity.slice(1)}`,
    'data-testid': 'mui-alert',
    'data-severity': severity,
    ...rest,
    ref
  },
  props.children,
  actionElement
  );
});

Alert.displayName = 'Alert';
module.exports = Alert;
