import React from 'react';

const MockFileUploader = ({
  readOnly = false,
  files = [],
  setFiles = () => {},
  setHasFiles = () => {},
  deletedFiles = [],
  setDeletedFiles = () => {}
}) => (
  <div data-testid="file-uploader">
    <div>{!readOnly ? 'documents' : 'documents-readonly'}</div>
    {files.map((file, index) => (
      <div key={index} data-testid={`file-${index}`}>
        {file.name || `File ${index + 1}`}
      </div>
    ))}
  </div>
);

export default MockFileUploader;
