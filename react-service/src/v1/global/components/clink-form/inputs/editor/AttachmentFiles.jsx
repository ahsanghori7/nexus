import React from 'react';
import { Badge } from 'react-bootstrap';
import { FileIcon } from 'react-file-icon';

const AttachmentFiles = ({ className, files, removeFile }) => {
  return (
    <div data-testid='list' className={`attachment-files-area ${className}`}>
      {files.map((file, i) => (
        <div
          key={file.name}
          className="attachment-file"
          style={{ WebkitFontSmoothing: 'antialiased' }}
          data-testid={`${file.name}-${i}`}
        >
          <FileIcon
            type="document"
            labelUppercase
            extension={file.type.split('/')[1]}
          />
          {file.name}
          <Badge
            data-testid={`remove-file-${i}`}
            className="remove-file"
            variant="light"
            onClick={() => removeFile(file.name)}
          >
            x
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default AttachmentFiles;
