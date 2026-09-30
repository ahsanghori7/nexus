import React from 'react';

const MockActions = ({ data, actions = [] }) => (
  <div data-testid="mock-actions">
    <span data-testid="actions-count">{actions.length}</span>
    <span data-testid="data-id">{data?.id}</span>
  </div>
);

export default MockActions;
