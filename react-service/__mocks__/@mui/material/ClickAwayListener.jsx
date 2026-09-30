import React from 'react';

export default function ClickAwayListener({ children, onClickAway }) {
  return <div data-testid="click-away-listener">{children}</div>;
}
