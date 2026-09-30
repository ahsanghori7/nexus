import React, { memo } from 'react';
import GreenButton from 'v1/global/components/general-ui/Buttons';

const MemoizedSubmit = memo(({ handleSubmit, isDisabled }) => {
  return (
    <GreenButton
      onClick={handleSubmit}
      type="button"
      label="Use this company"
      disabled={isDisabled}
    />
  );
});

export default MemoizedSubmit;
