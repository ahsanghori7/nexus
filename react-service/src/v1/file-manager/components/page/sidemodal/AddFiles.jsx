import React, { useRef } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';

const AddFiles = ({ tid, cid, addFiles, setLoading, setShowAllTenders }) => {
  const fileInput = useRef();

  const handleOnChange = (event) => {
    const { files: inputFiles } = event.target;
    setLoading(true);
    addFiles(Array.from(inputFiles), tid, cid);
  };

  const handleOnClickAddFile = () => {
    fileInput.current.click();
  };

  return (
    <div className="container-add-files">
      <Row>
        <strong>Add Files</strong>
      </Row>
      <Row className="container-buttons">
        <Button onClick={handleOnClickAddFile} className="upload-btn">
          Upload
        </Button>
        <input type="file" ref={fileInput} onChange={handleOnChange} multiple />
        <Button
          className="select-btn"
          variant="outline-info"
          onClick={() => setShowAllTenders(true)}
        >
          Select from existing media
        </Button>
      </Row>
    </div>
  );
};

export default AddFiles;
