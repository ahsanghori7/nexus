// __mocks__/@mui/material/Tooltip.js
import * as React from 'react';

const Tooltip = React.forwardRef(({ children, title, onOpen, onClose, ...rest }, ref) => {
  return React.createElement(
    'div',
    { 'data-testid': 'mui-tooltip', 'data-title': title, ...rest, ref },
    children
  );
});

Tooltip.displayName = 'Tooltip';

const tooltipClasses = {
  arrow: 'MuiTooltip-arrow',
  tooltip: 'MuiTooltip-tooltip',
  popper: 'MuiTooltip-popper',
};

module.exports = Tooltip;
module.exports.tooltipClasses = tooltipClasses;
