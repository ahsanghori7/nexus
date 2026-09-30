import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimes,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { getTypeLabel } from 'v1/global/helpers/data';
import Category from './Category';

const MAX_FILENAME_LENGTH = 50;

const ListOfItems = ({
  fileCategory = 'Architectural',
  files,
  handleRemove,
  checkValues,
  id,
  handleDeleteCategory,
  value,
  setFieldValue,
  fieldName,
}) => (
  <ListGroup>
    <ListGroup.Item key="title">
      <div className="column-1">
       {fileCategory && <Category
                  id={id}
                  files={files}
                  name={fileCategory}
                  checkValues={checkValues}
                  handleDeleteCategory={handleDeleteCategory}
                  categoryValue={value}
                  setFieldValue={setFieldValue}
                  fieldName={fieldName}
                />}
      </div>
      <div className="column-2">File type</div>
      <div className="column-3">Remove</div>
    </ListGroup.Item>
    {files.map((fileObject) => {
      const fileNameFormatted =
        fileObject.file.name.length >= MAX_FILENAME_LENGTH
          ? `${fileObject.file.name.slice(0, MAX_FILENAME_LENGTH)}...`
          : fileObject.file.name;
      const fileId = fileObject.id ? fileObject.id : fileObject.file.name;
      let fileType = getTypeLabel(fileObject.file.type);
      if (!fileType && fileObject.file.name) {
        const fileExtension = fileObject.file.name.split('.').pop().toLowerCase();
        fileType = getTypeLabel(fileExtension);
      }
      return (
        <ListGroup.Item key={fileId} className={fileObject.error && 'error'}>
          <div className="column-1">
            {!fileObject.error ? (
              <FontAwesomeIcon icon={faCheckCircle} />
            ) : (
              <FontAwesomeIcon icon={faTimesCircle} />
            )}{' '}
            <Tooltip title={fileObject.file.name}>
              <Typography component="span">{fileNameFormatted}</Typography>
            </Tooltip>
          </div>
          <div className="column-2">{fileType}</div>
          <div className="column-3">
            {!fileObject.error ? (
              <Button
                size="sm"
                variant="outline-danger"
                type="button"
                onClick={() => handleRemove(fileObject)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            ) : (
              <span>
                {fileObject && fileObject.error && fileObject.errorMessage
                  ? fileObject.errorMessage
                  : 'Upload failed'}
              </span>
            )}
          </div>
        </ListGroup.Item>
      );
    })}
  </ListGroup>
);

export default ListOfItems;
