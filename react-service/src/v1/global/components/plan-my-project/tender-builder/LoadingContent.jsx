import React from 'react';
import Loading from '../../Loading';

const LoadingContent = () => {
  return (
    <div className="tender-builder-container">
      <div className="loading-container">
        <div className="loading-content">
          <Loading />
          <strong className="center">Won&apos;t be long</strong>
          <small className="center">
            We&apos;re generating your tender builder
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoadingContent;
