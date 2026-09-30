import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import Row from 'react-bootstrap/Row';
import FolderSvg from '../../../../../global/public/images/svg/icon-folder.svg';
import Files from '../../../../helpers/Files';
import Folders from '../../../../helpers/Folders';
import Tenders from '../../../../helpers/Tenders';

const File = ({
  tid,
  cid,
  tenders,
  sidemodal,
  className = '',
  showAllTenders,
  selectAllChecked,
  deleteBulkFiles,
  selectAll,
  clickFolder,
}) => {
  const tender = Tenders.getTender(tenders, tid);
  const folder = Folders.getFolder(tender.folders, cid);

  const tenderlabel = tender ? tender.label : '';
  const folderLabel = folder ? folder.label : '';

  const handleClickBulkDelete = () => {
    const selectedFiles = folder ? Files.getSelected(folder.files) : [];
    if (selectedFiles.length) {
      deleteBulkFiles(selectedFiles);
    }
  };

  return (
    <>
      {!sidemodal && (
        <Row>
          <Col sm={12}>
            <h5>
              <FolderSvg />
              <Button variant="link" onClick={() => clickFolder(null)}>
                {tenderlabel}
                &nbsp; / &nbsp;
              </Button>
              <div className="category-name">{folderLabel}</div>
            </h5>
          </Col>
        </Row>
      )}
      {!sidemodal && (
        <Row>
          <Col sm={12}>
            <Dropdown>
              <Dropdown.Toggle id="dropdown-autoclose-true">
                Bulk actions
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  href="#"
                  className="delete-btn"
                  onClick={handleClickBulkDelete}
                >
                  Delete file
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      )}
      <div className={`${className} files-rows files-rows__header`}>
        <div className="cell cell--first">
          {!sidemodal && (
            <label
              className="input-container"
              htmlFor="select-all-files"
              aria-label="select-all-files"
            >
              <input
                type="checkbox"
                onChange={selectAll}
                checked={selectAllChecked}
                value={selectAllChecked}
                name="select-all-files"
              />
              <span className="checkmark" />
            </label>
          )}
          <strong>{sidemodal ? 'File Name' : 'Name'}</strong>
        </div>
        <div className="cell cell--second">
          <strong>File type</strong>
        </div>
        {!showAllTenders && (
          <div className="actions-column-list cell">
            <strong>Actions</strong>
          </div>
        )}
      </div>
    </>
  );
};

export default File;
