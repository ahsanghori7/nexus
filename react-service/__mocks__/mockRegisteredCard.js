import React from 'react';

const MockRegisteredCard = ({ item, image, version, cardTheme }) => (
  <div data-testid="registered-card" data-version={version} data-theme={cardTheme}>
    <div data-testid="card-image">{image}</div>
    <div data-testid="card-content">
      <div data-testid="card-id">{item?.id}</div>
      <div data-testid="card-title">{item?.title}</div>
      <div data-testid="card-description">{item?.description}</div>
    </div>
  </div>
);

export default MockRegisteredCard;
