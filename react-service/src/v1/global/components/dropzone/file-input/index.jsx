import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import StyledFileInput, { StyledFileInputContainer } from './styled';

const FileInput = forwardRef((props, ref) => {
  const { className, ...restInputProps } = props;
  return (
    <StyledFileInputContainer ref={ref}>
      <FontAwesomeIcon icon={faPlus} />
      <StyledFileInput {...restInputProps} className={className} />
      <span>Upload more files</span>
    </StyledFileInputContainer>
  );
});

export default FileInput;
