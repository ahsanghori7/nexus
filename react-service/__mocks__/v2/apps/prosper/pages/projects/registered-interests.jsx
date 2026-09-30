import React from 'react';

// Mock RegisteredInterests component
const RegisteredInterests = ({ resource, method, version }) => (
  <div data-testid="registered-interests-component" data-resource={resource} data-method={method} data-version={version}>
    Registered Interests Component
  </div>
);

export default RegisteredInterests;
