import React from 'react';
import iconFile from '../../../public/images/icon-file';
import LazyImage from '../../../../global/components/LazyImage';

const NoSlides = () => (
  <div data-testid="subcontractors-no-interests" className="no-slides w-100 border m-lg-2">
    <div className="no-slides-image w-100 d-flex justify-content-center align-items-center p-4">
      <LazyImage src={iconFile} alt="No Subcontractors Found" />
    </div>
    <div className="no-slides-text text-center mb-3 pb-1 pb-lg-2">
      <p className="no-slides-big font-weight-bold">
        We have sent your project to our subcontractors
      </p>
      <p className="no-slides-small">
        We will notify you when their status has changed
      </p>
    </div>
  </div>
);

export default NoSlides;
