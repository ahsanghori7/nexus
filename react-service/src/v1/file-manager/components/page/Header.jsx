import React, { useRef } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import GreenButton from '../../../global/components/general-ui/Buttons';
import CategoryModal from './category-modal';

const Header = ({
  sidemodal = false,
  tenderAddendum,
  selectedTender,
  selectedCategory,
  showAllTenders,
  selectedFiles,
  selectFromExistingMedia,
  addFolder,
  addFiles,
  setRoot,
  trAttachments,
  addSelectedToAttachments
}) => {
  const fileInput = useRef();
  const tenderIsSelected = Boolean(selectedTender);
  const categoryIsSelected = Boolean(selectedCategory);

  const handleOnChange = (event) => {
    const { files: inputFiles } = event.target;
    addFiles(Array.from(inputFiles));
  };

  const handleOnClickAddFile = () => {
    fileInput.current.click();
  };

  const handleOnClickGoRoot = (event) => {
    event.preventDefault();
    setRoot();
  };

  return (
    <Row>
      {!sidemodal &&  !trAttachments && (
        <Col className="project-header">
          <h1>
            <Button variant="link" onClick={handleOnClickGoRoot}>
              Project Documents
            </Button>
          </h1>
        </Col>
      )}
      <Col className="actions-header">
        {showAllTenders && !trAttachments && (
          <GreenButton
            label="Add selected to category"
            plusIcon={false}
            disabled={!selectedFiles.length}
            onClick={selectFromExistingMedia}
          />
        )}
        {trAttachments && (
          <GreenButton
            label="Attach Selected Files"
            plusIcon={false}
            disabled={!selectedFiles.length}
            onClick={addSelectedToAttachments}
          />
        )}
        {tenderIsSelected &&
          !categoryIsSelected &&
          !showAllTenders &&
          !tenderAddendum &&
          !trAttachments && (
            <CategoryModal
              sidemodal={sidemodal}
              addFolder={addFolder}
              label="Create new folder"
            />
          )}
        {tenderIsSelected && categoryIsSelected && !showAllTenders && !trAttachments && (
          <>
            <input
              type="file"
              ref={fileInput}
              onChange={handleOnChange}
              multiple
            />
            <GreenButton
              variant="success"
              label="Upload files"
              plusIcon={false}
              onClick={handleOnClickAddFile}
            />
          </>
        )}
      </Col>
    </Row>
  );
};

export default Header;
