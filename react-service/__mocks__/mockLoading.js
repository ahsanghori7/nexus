import React from 'react';

const MockLoading = ({ status }) => (
  status ? <div data-testid="loading-component">Loading...</div> : null
);

export default MockLoading;
