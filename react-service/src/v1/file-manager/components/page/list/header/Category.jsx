import React from 'react';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import Row from 'react-bootstrap/Row';
import Tenders from '../../../../helpers/Tenders';
import Folders from '../../../../helpers/Folders';
import alert from '../../../../../global/helpers/alert';

const Category = ({
  tid,
  tenders,
  sidemodal = false,
  selectAllChecked,
  bulkAddAllDocs,
  deleteBulkFolders,
  selectAll,
  maxLimitTitle,
  maxLimitMessage,
  showAllTenders,
}) => {
  const tender = Tenders.getTender(tenders, tid);
  const tenderName = tender ? tender.label : '';
  const pid = tender ? tender.pid : 0;

  const handleClickBulkDelete = () => {
    const selectedFolders = tender ? Folders.getSelected(tender.folders) : [];
    if (selectedFolders.length) {
      const selectedFolderIds = selectedFolders.map(
        (selectedFolder) => selectedFolder.id
      );
      deleteBulkFolders(selectedFolderIds);
    }
  };

  const handleCliCkBulkDownload = () => {
    const selectedFolders = tender ? Folders.getSelected(tender.folders) : [];
    if (selectedFolders.length) {
      const download = !tender.folders.filter(
        (folder) =>
          folder.checked && folder.files.length > Number(MAX_FILES_LIMIT)
      ).length;
      if (download) {
        const { type } = tender;
        const ids = selectedFolders
          .map((selectedFolder) => selectedFolder.id)
          .join(',');
        const zip = `${BASE_URLS.CLINK_APP_HOST}/download/${type}/categories/${tid}?ids=[${ids}]`;
        window.open(zip, '_blank');
      } else {
        alert(
          { success: false },
          null,
          {},
          {
            title: maxLimitTitle,
            message: maxLimitMessage,
            type: 'error',
          }
        );
      }
    }
  };

  return (
    <>
      {!sidemodal && (
        <Row>
          <Col sm={12}>
            <h5>{tenderName}</h5>
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
                  onClick={() => {
                    handleCliCkBulkDownload();
                  }}
                >
                  Download selected
                </Dropdown.Item>
                <Dropdown.Divider />
                {tid !== pid && (
                  <>
                    <Dropdown.Item onClick={bulkAddAllDocs}>
                      Add all project documents
                    </Dropdown.Item>
                    <Dropdown.Divider />
                  </>
                )}
                <Dropdown.Item
                  onClick={handleClickBulkDelete}
                  className="delete-btn"
                >
                  Delete selected
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      )}
      <div className="category-rows category-rows__header">
        <div className="cell cell--first">
          {!sidemodal && (
            <label
              className="input-container"
              htmlFor="select-all-categories"
              aria-label="select-all-categories"
            >
              <input
                type="checkbox"
                onChange={selectAll}
                checked={selectAllChecked}
                value={selectAllChecked}
                name="select-all-categories"
              />
              <span className="checkmark" />
            </label>
          )}
          {sidemodal ? <strong>Category</strong> : <strong>Name</strong>}
        </div>
        {!sidemodal && (
          <div className="cell cell--second">
            <strong>Total Documents</strong>
          </div>
        )}
        {!showAllTenders && (
          <div className="actions-column-list cell">
            <strong>Actions</strong>
          </div>
        )}
      </div>
    </>
  );
};

export default Category;
