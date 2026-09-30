import React from 'react';

const MockOpportunityCard = ({ item, distanceData }) => (
  <div data-testid="opportunity-card" data-item-id={item.id}>
    <div data-testid="card-id">{item.id}</div>
    <div data-testid="card-region">{item.region}</div>
    <div data-testid="card-type">{item.type}</div>
    <div data-testid="card-phase">{item.phase}</div>
    {item.isNew && <div data-testid="new-badge">New</div>}
    {distanceData && <div data-testid="distance-data">{distanceData.distance}</div>}
  </div>
);

export default MockOpportunityCard;
