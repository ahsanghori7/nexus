import React, { useRef, useState } from 'react';
import { Form, Button, Image } from 'react-bootstrap';
import { getProjectLogo } from 'v2/helpers/url';
import IconLandspace from '../../../public/images/svg/icon-landscape.svg';

function hideImageFailed(setSrc) {
  setSrc('');
}

const InputFile = ({ name, input, accept, multiple, setFieldValue, cdn }) => {
  const inputFile = useRef();
  const [src, setSrc] = useState(cdn && getProjectLogo(cdn));
  const inputProps = { ...input };
  const { value: filesValue } = inputProps;
  delete inputProps.value;

  const noFiles = filesValue === '' || !filesValue.files.length;
  let labelBtn = '';
  switch (accept) {
    case 'image/*':
      labelBtn =
        noFiles && (!cdn || src === '') ? 'Upload Image' : 'Replace Image';
      break;
    default:
      labelBtn =
        noFiles && (!cdn || src === '') ? 'Upload File' : 'Replace File';
  }

  const handleOnChange = (event) => {
    let arrayFiles = [];
    if (multiple && !noFiles) {
      arrayFiles = Array.prototype.slice.call(filesValue.files);
    }

    Array.prototype.forEach.call(event.target.files, (file) => {
      if (!arrayFiles.filter((f) => f.name === file.name).length) {
        arrayFiles.push(file);
      }
    });

    const listFiles = new DataTransfer();
    Array.from(arrayFiles).forEach((file) => {
      listFiles.items.add(file);
    });

    setFieldValue(name, arrayFiles.length ? listFiles : '');
    inputFile.current.value = '';
  };

  const removeUploadedFile = () => {
    const listFiles = new DataTransfer();
    if (!noFiles && multiple) {
      Array.from(filesValue.files).forEach((fileValue) => {
        if (fileValue.name !== file.name) {
          listFiles.items.add(fileValue);
        }
      });
    }
    if (!multiple && src) {
      setSrc('');
    }
    setFieldValue(name, listFiles.files.length ? listFiles : '');
  };
  return (
    <>
      <Form.Control
        ref={inputFile}
        {...inputProps}
        accept={accept}
        multiple={multiple}
        onChange={handleOnChange}
        style={{ display: 'none' }}
      />
      {!noFiles &&
        Array.prototype.map.call(filesValue.files, (file) => (
          <div key={file.name} className="container-thumbnail-files">
            <Image
              className="thumbnail-upload-file"
              src={URL.createObjectURL(file)}
              rounded
            />
            <Button
              variant="outline-danger"
              className="remove-file"
              onClick={removeUploadedFile}
            >
              X
            </Button>{' '}
          </div>
        ))}
      {noFiles && src && (
        <div key={src} className="container-thumbnail-files">
          <Image
            className="thumbnail-upload-file"
            src={src}
            rounded
            onError={() => hideImageFailed(setSrc)}
          />
          <Button
            variant="outline-danger"
            className="remove-file"
            onClick={removeUploadedFile}
          >
            X
          </Button>{' '}
        </div>
      )}
      <Button
        variant="success"
        className="upload-btn"
        onClick={() => {
          inputFile.current.click();
        }}
      >
        <IconLandspace />
        &nbsp;{labelBtn}
      </Button>
    </>
  );
};

export default InputFile;
