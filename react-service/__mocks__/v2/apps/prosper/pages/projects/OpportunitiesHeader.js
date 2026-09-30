import React from 'react';

const OpportunitiesHeader = ({ opportunities, subcontractor, account, isTitle = true }) => {
  return (
    <div data-testid="opportunities-header" role="banner">
      <div>Mock Opportunities Header</div>
      {isTitle && <h1>Opportunities</h1>}
    </div>
  );
};

export default OpportunitiesHeader;
