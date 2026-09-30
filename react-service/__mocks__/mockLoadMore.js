import React from 'react';

const MockLoadMore = ({ data, loaded, onLoad }) => (
  data && data.length > loaded ? (
    <button data-testid="load-more-button" onClick={onLoad}>
      Load More ({data.length - loaded} remaining)
    </button>
  ) : null
);

export default MockLoadMore;
