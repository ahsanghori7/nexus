import React from 'react';

// Mock OptViewer component
const OptViewer = ({ discover = false, title = 'Mock OptViewer', ...props }) => (
  <div data-testid="mock-opt-viewer" data-discover={discover}>
    <h2>{title}</h2>
    <div>Mock OptViewer Component</div>
  </div>
);

export default OptViewer;
