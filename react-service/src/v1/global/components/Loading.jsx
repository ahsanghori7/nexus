import React from 'react';
import Spinner from '../public/images/svg/icon-clink-logo.svg';

const Loading = ({ fullDiv = false }) => {
  const className = fullDiv ? 'loading loading__full-div' : 'loading';
  return (
    <div className={className}>
      <Spinner />
    </div>
  );
};

const LoadingV2 = () => {
  return <Spinner />;
};

export default Loading;
export { LoadingV2 };
