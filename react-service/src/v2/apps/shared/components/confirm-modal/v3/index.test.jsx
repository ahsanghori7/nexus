import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@mui/material', () => {
  const React = require('react');
  const createMock = (tag) => {
    const Component = React.forwardRef(({ children, sx, ...props }, ref) =>
      React.createElement(tag, { ref, ...props }, children)
    );
    Component.displayName = tag;
    return Component;
  };

  const Button = React.forwardRef(({ children, sx, ...props }, ref) => (
    <button type="button" ref={ref} {...props}>
      {children}
    </button>
  ));
  Button.displayName = 'Button';

  const Dialog = React.forwardRef(({ children, open, sx, ...props }, ref) => (
    <div data-testid="dialog" data-open={open ? 'true' : 'false'} ref={ref} {...props}>
      {children}
    </div>
  ));
  Dialog.displayName = 'Dialog';

  const IconButton = React.forwardRef(({ children, sx, ...props }, ref) => (
    <button type="button" ref={ref} {...props}>
      {children}
    </button>
  ));
  IconButton.displayName = 'IconButton';

  return {
    __esModule: true,
    Button,
    Dialog,
    DialogTitle: createMock('h2'),
    DialogContent: createMock('section'),
    DialogActions: createMock('footer'),
    IconButton,
    Typography: createMock('p'),
  };
});

jest.mock('@mui/material/styles', () => {
  const React = require('react');
  return {
    styled: (Component) => () => {
      const StyledComponent = React.forwardRef(({ sx, ...props }, ref) => (
        <Component ref={ref} {...props} />
      ));
      StyledComponent.displayName = `Styled(${Component.displayName || Component.name || 'Component'})`;
      return StyledComponent;
    },
  };
});

import ConfirmModal from './index.jsx';

describe('ConfirmModal v3', () => {
  it('renders modal content and handles primary actions', async () => {
    const handleAction = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        externalOpen
        title="Confirm Action"
        content="Are you sure you want to proceed?"
        actionLabel="Yes"
        closeLabel="No"
        handleAction={handleAction}
      />
    );

    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(handleAction).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
  });

  it('syncs open state with externalOpen prop changes', () => {
    const { rerender } = render(
      <ConfirmModal
        externalOpen={false}
        title="Dynamic Modal"
        content="First state"
        actionLabel="Accept"
        closeLabel="Close"
      />
    );

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');

    rerender(
      <ConfirmModal
        externalOpen
        title="Dynamic Modal"
        content="Second state"
        actionLabel="Accept"
        closeLabel="Close"
      />
    );

    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');
    expect(screen.getByText('Second state')).toBeInTheDocument();
  });
});
