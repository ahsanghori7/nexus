import React from 'react';
import UploadIcon from '../../../public/images/svg/icon-upload.svg';
import UploadingIcon from '../../../public/images/svg/icon-uploading.svg';
import UploadFailedIcon from '../../../public/images/svg/icon-upload-failed.svg';
import StyledDropArea from './styled';
import Typography from '@mui/material/Typography';
import { DEFAULT_MAX_SIZE_MB } from 'v2/helpers/files';

const DropArea = ({
  rootProps = {},
  inputProps = {},
  firstLine = 'Drag and drop your files or',
  secondLine = 'browse for your files',
  uploading = false,
  barWidth = 0,
  hasErrors = false,
}) => {
  const { style, ...restInputProps } = inputProps;
  const dropzoneClass = `dropzone${uploading ? ' dropzone--uploading' : ''}${hasErrors ? ' dropzone--errors' : ''
    }`;
  let uploadIcon = uploading ? <UploadingIcon /> : <UploadIcon />;
  if (hasErrors) {
    uploadIcon = <UploadFailedIcon />;
  }
  return (
    <StyledDropArea
      {...rootProps}
      className={dropzoneClass}
      barWidth={barWidth}
    >
      {restInputProps && style && (
        <input {...restInputProps} style={style} className="dropzone__input" />
      )}
      <div className="dropzone__content">
        {uploadIcon}
        <div className="dropzone__copy">
          {uploading && <p className="dropzone__copy--uploading">Uploading</p>}
          <p className="dropzone__copy--first">{firstLine}</p>
          <p className="dropzone__copy--second">{secondLine}</p>
          <Typography component="p">
            (Maximum file size: {DEFAULT_MAX_SIZE_MB}MB per file)
          </Typography>
        </div>
      </div>
    </StyledDropArea>
  );
};

export default DropArea;
